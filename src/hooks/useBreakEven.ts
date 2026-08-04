import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Profile, BreakEvenResult } from '../types'

// Глобальный кэш профиля в памяти для мгновенной отрисовки (0 ms)
let cachedProfile: Profile | null = null
let cachedBusinessExpenses: Record<string, number> = {}

export function clearAllMemoryCaches() {
  cachedProfile = null
  cachedBusinessExpenses = {}
}

const DEFAULT_PROFILE: Profile = {
  id: '',
  user_id: '',
  business_name: '',
  raw_purchase_price_per_kg: 0,
  yield_percent: 0,
  selling_price_per_kg: 0,
  desired_profit: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function useBreakEven(selectedMonth?: string) {
  const { user } = useAuth()
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthKey = selectedMonth || currentMonthStr

  const [profile, setProfile] = useState<Profile | null>(cachedProfile)
  // Если кэша нет и пользователь авторизован — считаем что данные ещё грузятся (избегаем флэша Onboarding)
  const [loading, setLoading] = useState(Boolean(user) && !cachedProfile)
  const [businessExpenses, setBusinessExpenses] = useState<number>(cachedBusinessExpenses[monthKey] || 0)

  const fetchAll = useCallback(async (showLoading = false) => {
    if (!user) return
    if (showLoading || !cachedProfile) {
      setLoading(true)
    }

    const isAll = monthKey === 'all'
    const from = isAll ? '2000-01-01' : `${monthKey}-01`

    const [profRes, expRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('expenses').select('date, amount').eq('user_id', user.id).gte('date', from)
    ])

    if (profRes.data) {
      cachedProfile = profRes.data as Profile
      setProfile(profRes.data as Profile)
    } else {
      cachedProfile = null
      setProfile(null)
    }

    if (expRes.data) {
      const filtered = isAll ? expRes.data : expRes.data.filter(e => e.date.startsWith(monthKey))
      const totalExp = filtered.reduce((s, e) => s + (e.amount || 0), 0)
      cachedBusinessExpenses[monthKey] = totalExp
      setBusinessExpenses(totalExp)
    }

    setLoading(false)
  }, [user, monthKey])

  useEffect(() => {
    fetchAll()
    const handleProfileUpdated = () => {
      setProfile(cachedProfile)
    }
    window.addEventListener('profile_updated', handleProfileUpdated)
    return () => window.removeEventListener('profile_updated', handleProfileUpdated)
  }, [fetchAll])

  const updateProfile = async (updates: Partial<Pick<Profile, 'business_name' | 'raw_purchase_price_per_kg' | 'yield_percent' | 'selling_price_per_kg' | 'desired_profit'>>) => {
    if (!user) return
    
    const current = profile || { ...DEFAULT_PROFILE, user_id: user.id }
    const updated: Profile = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    cachedProfile = updated
    setProfile(updated)

    // Сохранение в Supabase через UPSERT
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          business_name: updated.business_name || null,
          raw_purchase_price_per_kg: updated.raw_purchase_price_per_kg ?? 0,
          yield_percent: updated.yield_percent ?? 0,
          selling_price_per_kg: updated.selling_price_per_kg ?? 0,
          desired_profit: updated.desired_profit ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('Ошибка сохранения профиля:', error.message)
    }
    window.dispatchEvent(new Event('profile_updated'))
  }

  const resetEntireBusiness = async () => {
    if (!user) return

    // 1. Очищаем записи во всех таблицах
    await Promise.all([
      supabase.from('income').delete().eq('user_id', user.id),
      supabase.from('expenses').delete().eq('user_id', user.id),
      supabase.from('personal_expenses').delete().eq('user_id', user.id),
      supabase.from('profiles').delete().eq('user_id', user.id),
    ])

    // 2. Полностью сбрасываем кэш в памяти в 0
    cachedProfile = null
    cachedBusinessExpenses = {}
    setProfile(null)
    setBusinessExpenses(0)

    window.dispatchEvent(new Event('profile_updated'))
  }

  const calculate = (customDesiredProfit?: number): BreakEvenResult | null => {
    if (!profile) return null

    const rawPurchasePrice = profile.raw_purchase_price_per_kg ?? 0
    const yieldPct = profile.yield_percent ?? 0
    const price = profile.selling_price_per_kg ?? 0
    const desiredProfit = customDesiredProfit !== undefined ? customDesiredProfit : (profile.desired_profit ?? 0)

    // Если цены не настроены (равны 0), калькулятор возвращает null (чистый старт!)
    if (rawPurchasePrice <= 0 || price <= 0 || yieldPct <= 0) return null

    const yieldRatio = yieldPct / 100
    const realRawCostPerKg = rawPurchasePrice / yieldRatio
    const marginPerKg = price - realRawCostPerKg
    if (marginPerKg <= 0) return null

    const breakEvenFinishedKg = businessExpenses / marginPerKg
    const breakEvenRawKg      = breakEvenFinishedKg / yieldRatio
    const breakEvenRevenue   = breakEvenFinishedKg * price

    const targetFinishedKg   = (businessExpenses + desiredProfit) / marginPerKg
    const targetRawKg        = targetFinishedKg / yieldRatio
    const targetRevenue      = targetFinishedKg * price

    const activeKg = targetFinishedKg > 0 ? targetFinishedKg : breakEvenFinishedKg
    const businessExpensePerKg = activeKg > 0 ? businessExpenses / activeKg : 0
    const fullCostPerKg = realRawCostPerKg + businessExpensePerKg
    const netProfitPerKg = price - fullCostPerKg

    return {
      rawPurchasePricePerKg: rawPurchasePrice,
      yieldPercent: yieldPct,
      realRawCostPerKg,
      sellingPricePerKg: price,
      marginPerKg,
      businessExpenses,
      desiredProfit,
      breakEvenFinishedKg,
      breakEvenRawKg,
      breakEvenRevenue,
      targetFinishedKg,
      targetRawKg,
      targetRevenue,
      businessExpensePerKg,
      fullCostPerKg,
      netProfitPerKg,
    }
  }

  return { profile, loading, businessExpenses, updateProfile, resetEntireBusiness, calculate, refetch: () => fetchAll(true) }
}
