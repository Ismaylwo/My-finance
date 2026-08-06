import { useState, useMemo } from 'react'
import { useAppContext } from './useAppContext'
import type { MonthlySummary, DashboardStats } from '../types'

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
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr)
  const { incomes, expenses, personalExpenses, rawMaterialPurchases, loading, refetchAll } = useAppContext()

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      opts.push({ value: val, label: formatMonthName(val) })
    }
    opts.push({ value: 'all', label: 'За всё время' })
    return opts
  }, [now.getFullYear(), now.getMonth()])

  const stats = useMemo(() => {
    const isAll = selectedMonth === 'all'
    const selIncomes  = incomes.filter(i => isAll || i.date.startsWith(selectedMonth))
    const selExpenses = expenses.filter(e => isAll || e.date.startsWith(selectedMonth))
    const selPersonals = personalExpenses.filter(p => isAll || p.date.startsWith(selectedMonth))
    const selPurchases = rawMaterialPurchases.filter(p => isAll || p.date.startsWith(selectedMonth))

    const totalIncome   = selIncomes.reduce((s, r) => s + (Number(r.total_amount) || 0), 0)
    const totalKgSold   = selIncomes.reduce((s, r) => s + (Number(r.quantity_kg) || 0), 0)
    
    // Расходы бизнеса + Траты на закупку сырья
    const bizExpenses   = selExpenses.reduce((s, r) => s + (Number(r.amount) || 0), 0)
    const rawCosts      = selPurchases.reduce((s, r) => s + (Number(r.total_cost) || 0), 0)
    
    const totalExpenses = bizExpenses + rawCosts
    const totalPersonal = selPersonals.reduce((s, r) => s + (Number(r.amount) || 0), 0)
    const netProfit     = totalIncome - totalExpenses

    let incomeTrend: number | undefined
    let expenseTrend: number | undefined
    let profitTrend: number | undefined

    if (!isAll) {
      const [yyyy, mm] = selectedMonth.split('-').map(Number)
      const prevD = new Date(yyyy, mm - 2, 1)
      const prevPrefix = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`

      const prevIncomes  = incomes.filter(i => i.date.startsWith(prevPrefix))
      const prevExpenses = expenses.filter(e => e.date.startsWith(prevPrefix))
      const prevPurchases = rawMaterialPurchases.filter(p => p.date.startsWith(prevPrefix))

      const prevIncTotal = prevIncomes.reduce((s, r) => s + (Number(r.total_amount) || 0), 0)
      const prevBizExp   = prevExpenses.reduce((s, r) => s + (Number(r.amount) || 0), 0)
      const prevRawExp   = prevPurchases.reduce((s, r) => s + (Number(r.total_cost) || 0), 0)
      const prevExpTotal = prevBizExp + prevRawExp
      const prevNetProfit = prevIncTotal - prevExpTotal

      incomeTrend  = prevIncTotal > 0 ? ((totalIncome - prevIncTotal) / prevIncTotal) * 100 : undefined
      expenseTrend = prevExpTotal > 0 ? ((totalExpenses - prevExpTotal) / prevExpTotal) * 100 : undefined
      profitTrend  = prevNetProfit > 0 ? ((netProfit - prevNetProfit) / prevNetProfit) * 100 : undefined
    }

    return {
      totalIncome, totalExpenses, totalPersonal, netProfit, totalKgSold,
      incomeTrend, expenseTrend, profitTrend
    } as DashboardStats
  }, [incomes, expenses, personalExpenses, rawMaterialPurchases, selectedMonth])

  const categoryBreakdown = useMemo(() => {
    const isAll = selectedMonth === 'all'
    const selExpenses = expenses.filter(e => isAll || e.date.startsWith(selectedMonth))
    const categoryMap: Record<string, number> = {}
    
    selExpenses.forEach(exp => {
      const cat = exp.category || 'Прочее'
      categoryMap[cat] = (categoryMap[cat] || 0) + (exp.amount || 0)
    })
    
    // Добавляем Закупки сырья как отдельную категорию расходов в диаграмме
    const selPurchases = rawMaterialPurchases.filter(p => isAll || p.date.startsWith(selectedMonth))
    const totalPurchases = selPurchases.reduce((s, r) => s + (Number(r.total_cost) || 0), 0)
    if (totalPurchases > 0) {
      categoryMap['Закупка сырья (Склад)'] = totalPurchases
    }
    
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, rawMaterialPurchases, selectedMonth])

  const monthlyData = useMemo(() => {
    const months: MonthlySummary[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

      const mIncomes  = incomes.filter(item => item.date.startsWith(monthPrefix))
      const mExpenses = expenses.filter(item => item.date.startsWith(monthPrefix))
      const mPersonals = personalExpenses.filter(item => item.date.startsWith(monthPrefix))
      const mPurchases = rawMaterialPurchases.filter(item => item.date.startsWith(monthPrefix))

      const total_income   = mIncomes.reduce((s, r) => s + (Number(r.total_amount) || 0), 0)
      const biz_expenses   = mExpenses.reduce((s, r) => s + (Number(r.amount) || 0), 0)
      const raw_expenses   = mPurchases.reduce((s, r) => s + (Number(r.total_cost) || 0), 0)
      const total_expenses = biz_expenses + raw_expenses
      const total_personal = mPersonals.reduce((s, r) => s + (Number(r.amount) || 0), 0)
      const net_profit     = total_income - total_expenses
      const total_kg_sold  = mIncomes.reduce((s, r) => s + (Number(r.quantity_kg) || 0), 0)

      months.push({
        month: monthPrefix,
        total_income,
        total_expenses,
        total_personal,
        net_profit,
        total_kg_sold,
      })
    }
    return months
  }, [now.getFullYear(), now.getMonth(), incomes, expenses, personalExpenses, rawMaterialPurchases])

  return {
    stats, monthlyData, categoryBreakdown, loading,
    selectedMonth, setSelectedMonth, monthOptions,
    refetch: () => refetchAll(true)
  }
}
