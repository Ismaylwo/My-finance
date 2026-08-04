import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { MonthlySummary, DashboardStats } from '../types'

// Глобальный кэш в памяти (Stale-While-Revalidate) для мгновенного отклика (0 ms)
let cachedStats: Record<string, DashboardStats> = {}
let cachedMonthlyData: MonthlySummary[] | null = null
let cachedCategoryBreakdown: Record<string, { name: string; value: number }[]> = {}

export function clearDashboardCache() {
  cachedStats = {}
  cachedMonthlyData = null
  cachedCategoryBreakdown = {}
}

const MONTH_NAMES_RU: Record<string, string> = {
  '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
  '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
  '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь',
}

export function formatMonthName(monthStr: string): string {
  if (monthStr === 'all') return 'За всё время'
  const [yyyy, mm] = monthStr.split('-')
  const name = MONTH_NAMES_RU[mm] ?? mm
  return `${name} ${yyyy}`
}

export function useDashboard() {
  const { user } = useAuth()
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr)
  const [stats, setStats] = useState<DashboardStats>(
    cachedStats[currentMonthStr] || {
      totalIncome: 0, totalExpenses: 0, totalPersonal: 0,
      netProfit: 0, totalKgSold: 0,
    }
  )
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>(cachedMonthlyData || [])
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; value: number }[]>(
    cachedCategoryBreakdown[currentMonthStr] || []
  )
  const [loading, setLoading] = useState(!cachedStats[currentMonthStr])

  // Список вариантов доступных месяцев за 12 месяцев + "За всё время"
  const monthOptions: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthOptions.push({ value: val, label: formatMonthName(val) })
  }
  monthOptions.push({ value: 'all', label: 'За всё время' })

  const fetch = useCallback(async (showLoadingSpinner = false) => {
    if (!user) return
    if (showLoadingSpinner || !cachedStats[selectedMonth]) {
      setLoading(true)
    }

    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const fromDate = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

    const [incRes, expRes, perRes] = await Promise.all([
      supabase.from('income').select('date, total_amount, quantity_kg, is_paid').eq('user_id', user.id).gte('date', fromDate),
      supabase.from('expenses').select('date, amount, category').eq('user_id', user.id).gte('date', fromDate),
      supabase.from('personal_expenses').select('date, amount').eq('user_id', user.id).gte('date', fromDate),
    ])

    const incomes = incRes.data ?? []
    const expenses = expRes.data ?? []
    const personals = perRes.data ?? []

    const isAll = selectedMonth === 'all'
    const selIncomes  = incomes.filter(i => isAll || i.date.startsWith(selectedMonth))
    const selExpenses = expenses.filter(e => isAll || e.date.startsWith(selectedMonth))
    const selPersonals = personals.filter(p => isAll || p.date.startsWith(selectedMonth))

    const totalIncome   = selIncomes.reduce((s, r) => s + (r.total_amount || 0), 0)
    const totalKgSold   = selIncomes.reduce((s, r) => s + (r.quantity_kg || 0), 0)
    const totalExpenses = selExpenses.reduce((s, r) => s + (r.amount || 0), 0)
    const totalPersonal = selPersonals.reduce((s, r) => s + (r.amount || 0), 0)
    const netProfit     = totalIncome - totalExpenses

    const categoryMap: Record<string, number> = {}
    selExpenses.forEach(exp => {
      const cat = exp.category || 'Прочее'
      categoryMap[cat] = (categoryMap[cat] || 0) + (exp.amount || 0)
    })
    const breakdown = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    let incomeTrend: number | undefined
    let expenseTrend: number | undefined
    let profitTrend: number | undefined

    if (!isAll) {
      const [yyyy, mm] = selectedMonth.split('-').map(Number)
      const prevD = new Date(yyyy, mm - 2, 1)
      const prevPrefix = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`

      const prevIncomes  = incomes.filter(i => i.date.startsWith(prevPrefix))
      const prevExpenses = expenses.filter(e => e.date.startsWith(prevPrefix))

      const prevIncTotal = prevIncomes.reduce((s, r) => s + (r.total_amount || 0), 0)
      const prevExpTotal = prevExpenses.reduce((s, r) => s + (r.amount || 0), 0)
      const prevNetProfit = prevIncTotal - prevExpTotal

      incomeTrend  = prevIncTotal > 0 ? ((totalIncome - prevIncTotal) / prevIncTotal) * 100 : undefined
      expenseTrend = prevExpTotal > 0 ? ((totalExpenses - prevExpTotal) / prevExpTotal) * 100 : undefined
      profitTrend  = prevNetProfit > 0 ? ((netProfit - prevNetProfit) / prevNetProfit) * 100 : undefined
    }

    const newStats: DashboardStats = {
      totalIncome, totalExpenses, totalPersonal, netProfit, totalKgSold,
      incomeTrend, expenseTrend, profitTrend
    }

    const months: MonthlySummary[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

      const mIncomes  = incomes.filter(item => item.date.startsWith(monthPrefix))
      const mExpenses = expenses.filter(item => item.date.startsWith(monthPrefix))
      const mPersonals = personals.filter(item => item.date.startsWith(monthPrefix))

      const total_income   = mIncomes.reduce((s, r) => s + (r.total_amount || 0), 0)
      const total_kg_sold  = mIncomes.reduce((s, r) => s + (r.quantity_kg || 0), 0)
      const total_expenses = mExpenses.reduce((s, r) => s + (r.amount || 0), 0)
      const total_personal = mPersonals.reduce((s, r) => s + (r.amount || 0), 0)

      months.push({
        month: monthPrefix,
        total_income,
        total_expenses,
        total_personal,
        net_profit: total_income - total_expenses,
        total_kg_sold,
      })
    }

    cachedStats[selectedMonth] = newStats
    cachedMonthlyData = months
    cachedCategoryBreakdown[selectedMonth] = breakdown

    setStats(newStats)
    setMonthlyData(months)
    setCategoryBreakdown(breakdown)
    setLoading(false)
  }, [user, selectedMonth])

  useEffect(() => {
    fetch()
    const handleProfileUpdated = () => {
      clearDashboardCache()
      fetch(true)
    }
    window.addEventListener('profile_updated', handleProfileUpdated)
    return () => window.removeEventListener('profile_updated', handleProfileUpdated)
  }, [fetch])

  return {
    stats, monthlyData, categoryBreakdown, loading,
    selectedMonth, setSelectedMonth, monthOptions,
    refetch: () => fetch(true)
  }
}
