import { useCallback, useMemo } from 'react'
import { useAppContext } from './useAppContext'
import type { BreakEvenResult, PaceStatus, ProductionPace } from '../types'

interface BreakEvenInputs {
  rawPurchasePrice: number
  yieldPercent: number
  sellingPrice: number
  variableCostPerKg: number
  fixedExpenses: number
  desiredProfit: number
}

function buildBreakEvenResult({
  rawPurchasePrice,
  yieldPercent,
  sellingPrice,
  variableCostPerKg,
  fixedExpenses,
  desiredProfit,
}: BreakEvenInputs): BreakEvenResult | null {
  if (rawPurchasePrice <= 0 || yieldPercent <= 0 || sellingPrice <= 0) return null
  const yieldRatio = yieldPercent / 100
  const realRawCostPerKg = rawPurchasePrice / yieldRatio
  const marginPerKg = sellingPrice - realRawCostPerKg - variableCostPerKg
  if (marginPerKg <= 0) return null

  const breakEvenFinishedKg = fixedExpenses / marginPerKg
  const targetFinishedKg = (fixedExpenses + desiredProfit) / marginPerKg
  const activeKg = targetFinishedKg > 0 ? targetFinishedKg : breakEvenFinishedKg
  const businessExpensePerKg = activeKg > 0 ? fixedExpenses / activeKg : 0
  const fullCostPerKg = realRawCostPerKg + variableCostPerKg + businessExpensePerKg

  return {
    rawPurchasePricePerKg: rawPurchasePrice,
    yieldPercent,
    realRawCostPerKg,
    sellingPricePerKg: sellingPrice,
    marginPerKg,
    variableCostPerKg,
    businessExpenses: fixedExpenses,
    desiredProfit,
    breakEvenFinishedKg,
    breakEvenRawKg: breakEvenFinishedKg / yieldRatio,
    breakEvenRevenue: breakEvenFinishedKg * sellingPrice,
    targetFinishedKg,
    targetRawKg: targetFinishedKg / yieldRatio,
    targetRevenue: targetFinishedKg * sellingPrice,
    businessExpensePerKg,
    fullCostPerKg,
    netProfitPerKg: sellingPrice - fullCostPerKg,
  }
}

export function useBreakEven(selectedMonth?: string) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthKey = selectedMonth || currentMonth
  const {
    profile,
    expenses,
    incomes,
    dailyProduction,
    rawMaterialPurchases,
    loading,
    refetchAll,
    updateProfile,
    resetEntireBusiness,
  } = useAppContext()

  const belongsToPeriod = useCallback(
    (date: string) => monthKey === 'all' || date.startsWith(monthKey),
    [monthKey],
  )
  const periodExpenses = useMemo(
    () => expenses.filter(item => belongsToPeriod(item.date)),
    [expenses, belongsToPeriod],
  )
  const businessExpenses = useMemo(
    () => periodExpenses
      .filter(item => item.expense_type === 'fixed' || !item.expense_type)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [periodExpenses],
  )
  const variableExpenses = useMemo(
    () => periodExpenses
      .filter(item => item.expense_type !== 'fixed')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [periodExpenses],
  )

  const calculate = useCallback((customDesiredProfit?: number): BreakEvenResult | null => {
    if (!profile) return null
    return buildBreakEvenResult({
      rawPurchasePrice: Number(profile.raw_purchase_price_per_kg) || 0,
      yieldPercent: Number(profile.yield_percent) || 0,
      sellingPrice: Number(profile.selling_price_per_kg) || 0,
      variableCostPerKg: Number(profile.variable_cost_per_kg) || 0,
      fixedExpenses: businessExpenses,
      desiredProfit: customDesiredProfit ?? (Number(profile.desired_profit) || 0),
    })
  }, [profile, businessExpenses])

  const productionPace = useMemo((): ProductionPace => {
    const dailyCapacity = Number(profile?.daily_capacity_kg) || 0
    const planResult = calculate()
    const productions = dailyProduction.filter(item => belongsToPeriod(item.date))
    const sales = incomes.filter(item => belongsToPeriod(item.date))
    const purchases = rawMaterialPurchases.filter(item => belongsToPeriod(item.date))
    const totalProducedThisMonth = productions.reduce((sum, item) => sum + Number(item.finished_kg_produced), 0)
    const totalSoldThisMonth = sales.reduce((sum, item) => sum + Number(item.quantity_kg), 0)
    const totalRawUsed = productions.reduce((sum, item) => sum + Number(item.raw_kg_used), 0)
    const realYieldPercent = totalRawUsed > 0 ? (totalProducedThisMonth / totalRawUsed) * 100 : null
    const uniqueWorkingDates = new Set(productions.map(item => item.date))
    const daysWorked = uniqueWorkingDates.size

    const purchasedKg = purchases.reduce((sum, item) => sum + Number(item.quantity_kg), 0)
    const purchasedCost = purchases.reduce((sum, item) => sum + Number(item.total_cost), 0)
    const realRawPurchasePrice = purchasedKg > 0 ? purchasedCost / purchasedKg : null
    const productionVariableExpenses = periodExpenses
      .filter(item => item.expense_type === 'production_variable' || item.expense_type === 'variable')
      .reduce((sum, item) => sum + Number(item.amount), 0)
    const sellingVariableExpenses = periodExpenses
      .filter(item => item.expense_type === 'selling_variable')
      .reduce((sum, item) => sum + Number(item.amount), 0)
    const actualVariableCost = productionVariableExpenses > 0 || sellingVariableExpenses > 0
      ? (totalProducedThisMonth > 0 ? productionVariableExpenses / totalProducedThisMonth : 0)
        + (totalSoldThisMonth > 0 ? sellingVariableExpenses / totalSoldThisMonth : 0)
      : Number(profile?.variable_cost_per_kg) || 0

    const actualBreakEvenResult = buildBreakEvenResult({
      rawPurchasePrice: realRawPurchasePrice ?? (Number(profile?.raw_purchase_price_per_kg) || 0),
      yieldPercent: realYieldPercent ?? (Number(profile?.yield_percent) || 0),
      sellingPrice: Number(profile?.selling_price_per_kg) || 0,
      variableCostPerKg: actualVariableCost,
      fixedExpenses: businessExpenses,
      desiredProfit: Number(profile?.desired_profit) || 0,
    })
    const activeResult = actualBreakEvenResult || planResult

    const paceFor = (goal: number | null) => {
      if (!goal || dailyCapacity <= 0) {
        return { initial: null, actual: null, diff: null, status: 'no_data' as PaceStatus }
      }
      const initial = goal / dailyCapacity
      const remaining = Math.max(0, goal - totalSoldThisMonth)
      const actual = remaining / dailyCapacity
      if (daysWorked === 0) return { initial, actual, diff: null, status: 'no_data' as PaceStatus }
      const diff = initial - daysWorked - actual
      const rounded = Math.round(diff * 10) / 10
      const status: PaceStatus = rounded > 0 ? 'ahead' : rounded < 0 ? 'behind' : 'on_track'
      return { initial, actual, diff, status }
    }

    const breakEvenPace = paceFor(activeResult?.breakEvenFinishedKg ?? null)
    const targetPace = paceFor(activeResult && activeResult.desiredProfit > 0 ? activeResult.targetFinishedKg : null)
    const goal = activeResult
      ? activeResult.desiredProfit > 0 ? activeResult.targetFinishedKg : activeResult.breakEvenFinishedKg
      : 0

    return {
      totalProducedThisMonth,
      totalSoldThisMonth,
      daysWorked,
      progressPercent: goal > 0 ? Math.min(150, (totalSoldThisMonth / goal) * 100) : 0,
      realYieldPercent,
      realRawPurchasePrice,
      actualBreakEvenResult,
      initialDaysToBreakEven: breakEvenPace.initial,
      actualDaysToBreakEven: breakEvenPace.actual,
      breakEvenDiffDays: breakEvenPace.diff,
      breakEvenStatus: breakEvenPace.status,
      initialDaysToTarget: targetPace.initial,
      actualDaysToTarget: targetPace.actual,
      targetDiffDays: targetPace.diff,
      targetStatus: targetPace.status,
    }
  }, [profile, calculate, dailyProduction, incomes, rawMaterialPurchases, belongsToPeriod, periodExpenses, businessExpenses])

  return {
    profile,
    loading,
    businessExpenses,
    variableExpenses,
    updateProfile,
    resetEntireBusiness,
    calculate,
    productionPace,
    refetch: () => refetchAll(true),
  }
}
