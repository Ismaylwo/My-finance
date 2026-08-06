import { useCallback, useMemo } from 'react'
import { useAppContext } from './useAppContext'
import type { BreakEvenResult, ProductionPace, PaceStatus } from '../types'

export function useBreakEven(selectedMonth?: string) {
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthKey = selectedMonth || currentMonthStr

  const { profile, expenses, dailyProduction, rawMaterialPurchases, loading, refetchAll, updateProfile, resetEntireBusiness } = useAppContext()

  // Бизнес-расходы за выбранный месяц
  const businessExpenses = useMemo(() => {
    const isAll = monthKey === 'all'
    return expenses
      .filter(e => isAll || e.date.startsWith(monthKey))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0)
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
    const breakEvenRevenue    = breakEvenFinishedKg * price

    const targetFinishedKg    = (businessExpenses + desiredProfit) / marginPerKg
    const targetRawKg         = targetFinishedKg / yieldRatio
    const targetRevenue       = targetFinishedKg * price

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

  // ── Темп производства — расчёт для текущего месяца ─────────────────
  const productionPace = useMemo((): ProductionPace => {
    const dailyCapacity = profile?.daily_capacity_kg ?? 0
    const breakEvenResult = calculate()

    // Текущий месяц
    const today = new Date()

    // Произведено в текущем месяце (и количество уникальных рабочих дней)
    const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    
    const monthProductions = dailyProduction.filter(d => d.date.startsWith(currentMonthPrefix))
    
    const totalProducedThisMonth = monthProductions.reduce((s, d) => s + Number(d.finished_kg_produced), 0)
    const totalRawUsedThisMonth = monthProductions.reduce((s, d) => s + Number(d.raw_kg_used), 0)
    const realYieldPercent = totalRawUsedThisMonth > 0 ? (totalProducedThisMonth / totalRawUsedThisMonth) * 100 : null
    
    // Считаем количество РЕАЛЬНЫХ рабочих дней (по уникальным датам в журнале)
    const uniqueWorkingDates = new Set(monthProductions.map(d => d.date))
    const daysWorked = uniqueWorkingDates.size

    // 2. ФАКТИЧЕСКИЕ ДАННЫЕ И ДИНАМИЧЕСКАЯ ТОЧКА 0
    const monthPurchases = rawMaterialPurchases.filter(p => p.date.startsWith(currentMonthPrefix))
    const totalPurchasedKg = monthPurchases.reduce((s, p) => s + Number(p.quantity_kg), 0)
    const totalPurchasedCost = monthPurchases.reduce((s, p) => s + Number(p.total_cost), 0)
    const realRawPurchasePrice = totalPurchasedKg > 0 ? totalPurchasedCost / totalPurchasedKg : null

    let actualBreakEvenResult: BreakEvenResult | null = null
    const price = profile?.selling_price_per_kg ?? 0
    const desiredProfit = profile?.desired_profit ?? 0
    const factRawPurchasePrice = realRawPurchasePrice ?? profile?.raw_purchase_price_per_kg ?? 0
    const factYieldPct = realYieldPercent ?? profile?.yield_percent ?? 0

    if (factRawPurchasePrice > 0 && price > 0 && factYieldPct > 0) {
        const yieldRatio = factYieldPct / 100
        const realRawCostPerKg = factRawPurchasePrice / yieldRatio
        const marginPerKg = price - realRawCostPerKg

        if (marginPerKg > 0) {
            const breakEvenFinishedKg = businessExpenses / marginPerKg
            const targetFinishedKg = (businessExpenses + desiredProfit) / marginPerKg
            const activeKg = targetFinishedKg > 0 ? targetFinishedKg : breakEvenFinishedKg
            const businessExpensePerKg = activeKg > 0 ? businessExpenses / activeKg : 0
            
            actualBreakEvenResult = {
                rawPurchasePricePerKg: factRawPurchasePrice,
                yieldPercent: factYieldPct,
                realRawCostPerKg,
                sellingPricePerKg: price,
                marginPerKg,
                businessExpenses,
                desiredProfit,
                breakEvenFinishedKg,
                breakEvenRawKg: breakEvenFinishedKg / yieldRatio,
                breakEvenRevenue: breakEvenFinishedKg * price,
                targetFinishedKg,
                targetRawKg: targetFinishedKg / yieldRatio,
                targetRevenue: targetFinishedKg * price,
                businessExpensePerKg,
                fullCostPerKg: realRawCostPerKg + businessExpensePerKg,
                netProfitPerKg: price - (realRawCostPerKg + businessExpensePerKg),
            }
        }
    }

    const activeResult = actualBreakEvenResult || breakEvenResult

    // 3. МЕТРИКИ ТЕМПА
    let initialDaysToBreakEven: number | null = null
    let actualDaysToBreakEven: number | null = null
    let breakEvenDiffDays: number | null = null
    let breakEvenStatus: PaceStatus = 'no_data'

    let initialDaysToTarget: number | null = null
    let actualDaysToTarget: number | null = null
    let targetDiffDays: number | null = null
    let targetStatus: PaceStatus = 'no_data'

    if (activeResult && dailyCapacity > 0) {
      // ТОЧКА 0
      initialDaysToBreakEven = activeResult.breakEvenFinishedKg / dailyCapacity
      const expectedDaysLeftBE = initialDaysToBreakEven - daysWorked
      const remainingForBreakEven = Math.max(0, activeResult.breakEvenFinishedKg - totalProducedThisMonth)
      actualDaysToBreakEven = remainingForBreakEven / dailyCapacity
      
      if (daysWorked > 0) {
        breakEvenDiffDays = expectedDaysLeftBE - actualDaysToBreakEven
        const diffBE = Math.round(breakEvenDiffDays * 10) / 10
        if (diffBE > 0) breakEvenStatus = 'ahead'
        else if (diffBE < 0) breakEvenStatus = 'behind'
        else breakEvenStatus = 'on_track'
      }

      // ЖЕЛАЕМАЯ ПРИБЫЛЬ
      if (activeResult.desiredProfit > 0) {
        initialDaysToTarget = activeResult.targetFinishedKg / dailyCapacity
        const expectedDaysLeftTarget = initialDaysToTarget - daysWorked
        const remainingForTarget = Math.max(0, activeResult.targetFinishedKg - totalProducedThisMonth)
        actualDaysToTarget = remainingForTarget / dailyCapacity
        
        if (daysWorked > 0) {
          targetDiffDays = expectedDaysLeftTarget - actualDaysToTarget
          const diffTarget = Math.round(targetDiffDays * 10) / 10
          if (diffTarget > 0) targetStatus = 'ahead'
          else if (diffTarget < 0) targetStatus = 'behind'
          else targetStatus = 'on_track'
        }
      }
    }
    const monthGoal = activeResult
      ? (activeResult.desiredProfit > 0 ? activeResult.targetFinishedKg : activeResult.breakEvenFinishedKg)
      : 0

    const progressPercent = monthGoal > 0 ? Math.min(150, (totalProducedThisMonth / monthGoal) * 100) : 0

    // Return objects...

    return {
      totalProducedThisMonth,
      daysWorked,
      progressPercent,
      realYieldPercent,
      realRawPurchasePrice,
      actualBreakEvenResult,
      
      initialDaysToBreakEven,
      actualDaysToBreakEven,
      breakEvenDiffDays,
      breakEvenStatus,
      
      initialDaysToTarget,
      actualDaysToTarget,
      targetDiffDays,
      targetStatus
    }
  }, [profile, dailyProduction, calculate])

  return {
    profile,
    loading,
    businessExpenses,
    updateProfile,
    resetEntireBusiness,
    calculate,
    productionPace,
    refetch: () => refetchAll(true),
  }
}
