import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Profile, Income, Expense, PersonalExpense, DailyProduction, RawMaterialPurchase, WarehouseBalance } from '../types'

interface AppContextType {
  profile: Profile | null
  incomes: Income[]
  expenses: Expense[]
  personalExpenses: PersonalExpense[]
  dailyProduction: DailyProduction[]
  rawMaterialPurchases: RawMaterialPurchase[]
  warehouseBalance: WarehouseBalance
  loading: boolean
  error: string | null

  // Actions
  refetchAll: (showLoading?: boolean) => Promise<void>
  updateProfile: (updates: Partial<Pick<Profile,
    'business_name' | 'raw_purchase_price_per_kg' | 'yield_percent' |
    'selling_price_per_kg' | 'desired_profit' | 'daily_capacity_kg' |
    'initial_raw_kg' | 'initial_finished_kg'
  >>) => Promise<void>
  resetEntireBusiness: () => Promise<void>
  setIncomes: React.Dispatch<React.SetStateAction<Income[]>>
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
  setPersonalExpenses: React.Dispatch<React.SetStateAction<PersonalExpense[]>>
  setDailyProduction: React.Dispatch<React.SetStateAction<DailyProduction[]>>
  setRawMaterialPurchases: React.Dispatch<React.SetStateAction<RawMaterialPurchase[]>>
}

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

const DEFAULT_PROFILE: Profile = {
  id: '',
  user_id: '',
  business_name: '',
  raw_purchase_price_per_kg: 0,
  yield_percent: 0,
  selling_price_per_kg: 0,
  desired_profit: 0,
  daily_capacity_kg: 0,
  initial_raw_kg: 0,
  initial_finished_kg: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [personalExpenses, setPersonalExpenses] = useState<PersonalExpense[]>([])
  const [dailyProduction, setDailyProduction] = useState<DailyProduction[]>([])
  const [rawMaterialPurchases, setRawMaterialPurchases] = useState<RawMaterialPurchase[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async (showLoading = true) => {
    if (!user) {
      setProfile(null); setIncomes([]); setExpenses([])
      setPersonalExpenses([]); setDailyProduction([]); setRawMaterialPurchases([])
      setLoading(false)
      return
    }

    if (showLoading) setLoading(true)
    setError(null)

    try {
      const [profRes, incRes, expRes, perRes, dpRes, rmpRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('income').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('personal_expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('daily_production').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('raw_material_purchases').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      ])

      if (profRes.error && profRes.error.code !== 'PGRST116') throw profRes.error

      setProfile((profRes.data as Profile) || null)
      setIncomes((incRes.data || []) as Income[])
      setExpenses((expRes.data || []) as Expense[])
      setPersonalExpenses((perRes.data || []) as PersonalExpense[])
      setDailyProduction((dpRes.data || []) as DailyProduction[])
      setRawMaterialPurchases((rmpRes.data || []) as RawMaterialPurchase[])
    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    fetchAll()
  }, [fetchAll, authLoading])

  // ── Склад: вычисляем на клиенте из уже загруженных данных ──────────
  const warehouseBalance = useMemo((): WarehouseBalance => {
    const p = profile
    // Number() защищает от строкового типа который Supabase иногда возвращает для NUMERIC
    const totalPurchasedRaw = rawMaterialPurchases.reduce((s, r) => s + Number(r.quantity_kg), 0)
    const totalRawUsed      = dailyProduction.reduce((s, d) => s + Number(d.raw_kg_used), 0)
    const totalFinished     = dailyProduction.reduce((s, d) => s + Number(d.finished_kg_produced), 0)
    const totalSold         = incomes.reduce((s, i) => s + Number(i.quantity_kg), 0)

    return {
      raw_kg_balance:      Number(p?.initial_raw_kg ?? 0) + totalPurchasedRaw - totalRawUsed,
      finished_kg_balance: Number(p?.initial_finished_kg ?? 0) + totalFinished - totalSold,
    }
  }, [profile, rawMaterialPurchases, dailyProduction, incomes])

  const updateProfile = async (updates: Partial<Pick<Profile,
    'business_name' | 'raw_purchase_price_per_kg' | 'yield_percent' |
    'selling_price_per_kg' | 'desired_profit' | 'daily_capacity_kg' |
    'initial_raw_kg' | 'initial_finished_kg'
  >>) => {
    if (!user) return
    const current = profile || { ...DEFAULT_PROFILE, user_id: user.id }
    const updated: Profile = { ...current, ...updates, updated_at: new Date().toISOString() }
    setProfile(updated) // Оптимистичное обновление

    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      business_name: updated.business_name || null,
      raw_purchase_price_per_kg: updated.raw_purchase_price_per_kg ?? 0,
      yield_percent: updated.yield_percent ?? 0,
      selling_price_per_kg: updated.selling_price_per_kg ?? 0,
      desired_profit: updated.desired_profit ?? 0,
      daily_capacity_kg: updated.daily_capacity_kg ?? 0,
      initial_raw_kg: updated.initial_raw_kg ?? 0,
      initial_finished_kg: updated.initial_finished_kg ?? 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) {
      console.error('Ошибка сохранения профиля:', error.message)
      await fetchAll(false)
    }
  }

  const resetEntireBusiness = async () => {
    if (!user) return
    await Promise.all([
      supabase.from('income').delete().eq('user_id', user.id),
      supabase.from('expenses').delete().eq('user_id', user.id),
      supabase.from('personal_expenses').delete().eq('user_id', user.id),
      supabase.from('daily_production').delete().eq('user_id', user.id),
      supabase.from('raw_material_purchases').delete().eq('user_id', user.id),
      supabase.from('profiles').delete().eq('user_id', user.id),
    ])
    setProfile(null); setIncomes([]); setExpenses([])
    setPersonalExpenses([]); setDailyProduction([]); setRawMaterialPurchases([])
  }

  const value: AppContextType = {
    profile, incomes, expenses, personalExpenses,
    dailyProduction, rawMaterialPurchases, warehouseBalance,
    loading: authLoading || loading, error,
    refetchAll: fetchAll,
    updateProfile, resetEntireBusiness,
    setIncomes, setExpenses, setPersonalExpenses,
    setDailyProduction, setRawMaterialPurchases,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}



