import { useCallback, useMemo } from 'react'
import { useAppContext } from './useAppContext'
import type { BreakEvenResult } from '../types'

export function useBreakEven(selectedMonth?: string) {
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthKey = selectedMonth || currentMonthStr

  const { profile, expenses, loading, refetchAll, updateProfile, resetEntireBusiness } = useAppContext()

  // Calculate businessExpenses for the selected month
  const businessExpenses = useMemo(() => {
    const isAll = monthKey === 'all'
    const filteredExpenses = expenses.filter(e => isAll || e.date.startsWith(monthKey))
    return filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0)
  }, [expenses, monthKey])

  const calculate = useCallback((customDesiredProfit?: number): BreakEvenResult | null => {
    if (!profile) return null

    const rawPurchasePrice = profile.raw_purchase_price_per_kg ?? 0
    const yieldPct = profile.yield_percent ?? 0
    const price = profile.selling_price_per_kg ?? 0
    const desiredProfit = customDesiredProfit !== undefined ? customDesiredProfit : (profile.desired_profit ?? 0)

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
  }, [profile, businessExpenses])

  return {
    profile,
    loading,
    businessExpenses,
    updateProfile,
    resetEntireBusiness,
    calculate,
    refetch: () => refetchAll(true),
  }
}
