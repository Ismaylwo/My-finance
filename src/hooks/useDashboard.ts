import { useCallback, useMemo, useState } from 'react'
import { useAppContext } from './useAppContext'
import { calculatePeriodFinance, calculateTrend } from '../lib/finance'
import type { DashboardStats, MonthlySummary } from '../types'

const MONTH_NAMES_RU: Record<string, string> = {
  '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
  '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
  '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь',
}

export function formatMonthName(monthStr: string): string {
  if (monthStr === 'all') return 'За всё время'
  const [year, month] = monthStr.split('-')
  return `${MONTH_NAMES_RU[month] ?? month} ${year}`
}

export function useDashboard() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthIndex = now.getMonth()
  const currentMonth = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const {
    profile,
    incomes,
    incomePayments,
    paymentsAvailable,
    expenses,
    personalExpenses,
    rawMaterialPurchases,
    dailyProduction,
    inventoryLedger,
    loading,
    refetchAll,
  } = useAppContext()

  const monthOptions = useMemo(() => {
    const options = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(currentYear, currentMonthIndex - index, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return { value, label: formatMonthName(value) }
    })
    return [...options, { value: 'all', label: 'За всё время' }]
  }, [currentYear, currentMonthIndex])

  const financeFor = useCallback((month: string) => {
    const includes = (date: string) => month === 'all' || date.startsWith(month)
    return calculatePeriodFinance({
      incomes: incomes.filter(item => includes(item.date)),
      expenses: expenses.filter(item => includes(item.date)),
      personalExpenses: personalExpenses.filter(item => includes(item.date)),
      rawMaterialPurchases: rawMaterialPurchases.filter(item => includes(item.date)),
      dailyProduction: dailyProduction.filter(item => includes(item.date)),
      paymentsInPeriod: incomePayments.filter(item => includes(item.date)),
      allPayments: incomePayments,
      usePaymentLedger: paymentsAvailable,
      cogsByIncomeId: inventoryLedger.cogsByIncomeId,
      fallbackRawPrice: Number(profile?.raw_purchase_price_per_kg) || 0,
      fallbackYieldPercent: Number(profile?.yield_percent) || 0,
    })
  }, [incomes, expenses, personalExpenses, rawMaterialPurchases, dailyProduction, incomePayments, paymentsAvailable, inventoryLedger, profile])

  const stats = useMemo(() => {
    const current = financeFor(selectedMonth)
    const allTime = selectedMonth === 'all' ? current : financeFor('all')
    let incomeTrend: number | undefined
    let expenseTrend: number | undefined
    let profitTrend: number | undefined

    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-').map(Number)
      const previousDate = new Date(year, month - 2, 1)
      const previousMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`
      const previous = financeFor(previousMonth)
      incomeTrend = calculateTrend(current.salesRevenue, previous.salesRevenue)
      expenseTrend = calculateTrend(current.totalAccountingExpenses, previous.totalAccountingExpenses)
      profitTrend = calculateTrend(current.estimatedNetProfit, previous.estimatedNetProfit)
    }

    return {
      totalIncome: current.salesRevenue,
      totalExpenses: current.totalAccountingExpenses,
      totalPersonal: current.personalWithdrawals,
      netProfit: current.estimatedNetProfit,
      totalKgSold: current.totalKgSold,
      paidIncome: current.paidRevenue,
      receivables: current.receivables,
      totalReceivables: allTime.receivables,
      operatingExpenses: current.operatingExpenses,
      inventoryPurchases: current.inventoryPurchases,
      estimatedCogs: current.estimatedCostOfGoodsSold,
      cashResult: current.cashResult,
      cashAfterPersonal: current.cashAfterPersonal,
      grossProfit: current.grossProfit,
      rawInventoryValue: inventoryLedger.rawValue,
      finishedInventoryValue: inventoryLedger.finishedValue,
      calculationReady: current.calculationReady,
      incomeTrend,
      expenseTrend,
      profitTrend,
    } satisfies DashboardStats
  }, [selectedMonth, financeFor, inventoryLedger.rawValue, inventoryLedger.finishedValue])

  const categoryBreakdown = useMemo(() => {
    const includes = (date: string) => selectedMonth === 'all' || date.startsWith(selectedMonth)
    const categories: Record<string, number> = {}
    expenses.filter(item => includes(item.date)).forEach(item => {
      const category = item.category || 'Прочее'
      categories[category] = (categories[category] || 0) + (Number(item.amount) || 0)
    })
    const purchases = rawMaterialPurchases
      .filter(item => includes(item.date))
      .reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0)
    if (purchases > 0) categories['Закупка запасов'] = purchases
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, rawMaterialPurchases, selectedMonth])

  const monthlyData = useMemo(() => Array.from({ length: 6 }, (_, reverseIndex) => {
    const index = 5 - reverseIndex
    const date = new Date(currentYear, currentMonthIndex - index, 1)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const result = financeFor(month)
    return {
      month,
      total_income: result.salesRevenue,
      total_expenses: result.totalAccountingExpenses,
      total_personal: result.personalWithdrawals,
      net_profit: result.estimatedNetProfit,
      total_kg_sold: result.totalKgSold,
      paid_income: result.paidRevenue,
      receivables: result.receivables,
      operating_expenses: result.operatingExpenses,
      recognized_operating_expenses: result.recognizedOperatingExpenses,
      inventory_purchases: result.inventoryPurchases,
      estimated_cogs: result.estimatedCostOfGoodsSold,
      cash_result: result.cashResult,
      cash_after_personal: result.cashAfterPersonal,
      gross_profit: result.grossProfit,
      calculation_ready: result.calculationReady,
    } satisfies MonthlySummary
  }), [currentYear, currentMonthIndex, financeFor])

  return {
    stats,
    monthlyData,
    categoryBreakdown,
    loading,
    selectedMonth,
    setSelectedMonth,
    monthOptions,
    refetch: () => refetchAll(true),
  }
}
