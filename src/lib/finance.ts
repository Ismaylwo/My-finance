import type {
  DailyProduction,
  Expense,
  Income,
  IncomePayment,
  PersonalExpense,
  Profile,
  RawMaterialPurchase,
} from '../types'

const EPSILON = 0.000001

export interface InventoryIssue {
  date: string
  type: 'raw_shortage' | 'finished_shortage' | 'missing_purchase_price' | 'missing_cost'
  message: string
}

export interface InventoryLedger {
  cogsByIncomeId: Record<string, number>
  unitCostByIncomeId: Record<string, number>
  rawQuantity: number
  rawValue: number
  rawAverageCost: number
  finishedQuantity: number
  finishedValue: number
  finishedAverageCost: number
  issues: InventoryIssue[]
}

export interface PeriodFinance {
  salesRevenue: number
  paidRevenue: number
  receivables: number
  operatingExpenses: number
  recognizedOperatingExpenses: number
  fixedExpenses: number
  variableExpenses: number
  inventoryPurchases: number
  estimatedCostOfGoodsSold: number
  grossProfit: number
  totalAccountingExpenses: number
  estimatedNetProfit: number
  cashResult: number
  cashAfterPersonal: number
  personalWithdrawals: number
  totalKgSold: number
  averageRawPurchasePrice: number | null
  actualYieldPercent: number | null
  rawCostPerFinishedKg: number | null
  calculationReady: boolean
}

interface InventoryInput {
  profile: Profile | null
  incomes: Income[]
  expenses?: Expense[]
  rawMaterialPurchases: RawMaterialPurchase[]
  dailyProduction: DailyProduction[]
}

interface PeriodFinanceInput {
  incomes: Income[]
  expenses: Expense[]
  personalExpenses: PersonalExpense[]
  rawMaterialPurchases: RawMaterialPurchase[]
  dailyProduction: DailyProduction[]
  paymentsInPeriod?: IncomePayment[]
  allPayments?: IncomePayment[]
  usePaymentLedger?: boolean
  cogsByIncomeId?: Record<string, number>
  fallbackRawPrice?: number
  fallbackYieldPercent?: number
}

type LedgerEvent =
  | { type: 'purchase'; date: string; createdAt: string; item: RawMaterialPurchase }
  | { type: 'production'; date: string; createdAt: string; item: DailyProduction }
  | { type: 'sale'; date: string; createdAt: string; item: Income }

export const amount = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const positiveOr = (value: unknown, fallback: number) => {
  const parsed = amount(value)
  return parsed > 0 ? parsed : fallback
}

export function calculateInventoryLedger({
  profile,
  incomes,
  expenses = [],
  rawMaterialPurchases,
  dailyProduction,
}: InventoryInput): InventoryLedger {
  const plannedRawCost = positiveOr(profile?.raw_purchase_price_per_kg, 0)
  const plannedYield = positiveOr(profile?.yield_percent, 0)
  const openingRawCost = positiveOr(profile?.initial_raw_cost_per_kg, plannedRawCost)
  const plannedFinishedCost = plannedYield > 0 ? plannedRawCost / (plannedYield / 100) : 0
  const openingFinishedCost = positiveOr(profile?.initial_finished_cost_per_kg, plannedFinishedCost)

  let rawQuantity = amount(profile?.initial_raw_kg)
  let rawValue = rawQuantity * openingRawCost
  let finishedQuantity = amount(profile?.initial_finished_kg)
  let finishedValue = finishedQuantity * openingFinishedCost
  const cogsByIncomeId: Record<string, number> = {}
  const unitCostByIncomeId: Record<string, number> = {}
  const issues: InventoryIssue[] = []

  // Переменные производственные расходы (упаковка, сдельная работа и т. п.)
  // капитализируются в готовую продукцию того же месяца. Их часть попадает в
  // прибыль только при продаже продукции, а остаток остаётся в стоимости склада.
  const variableExpenseByMonth = new Map<string, number>()
  const producedByMonth = new Map<string, number>()
  expenses
    .filter(item => item.expense_type === 'production_variable' || item.expense_type === 'variable')
    .forEach(item => {
      const month = item.date.slice(0, 7)
      variableExpenseByMonth.set(month, (variableExpenseByMonth.get(month) ?? 0) + amount(item.amount))
    })
  dailyProduction.forEach(item => {
    const month = item.date.slice(0, 7)
    producedByMonth.set(month, (producedByMonth.get(month) ?? 0) + amount(item.finished_kg_produced))
  })

  const events: LedgerEvent[] = [
    ...rawMaterialPurchases.map(item => ({
      type: 'purchase' as const,
      date: item.date,
      createdAt: item.created_at,
      item,
    })),
    ...dailyProduction.map(item => ({
      type: 'production' as const,
      date: item.date,
      createdAt: item.created_at,
      item,
    })),
    ...incomes.map(item => ({
      type: 'sale' as const,
      date: item.date,
      createdAt: item.created_at,
      item,
    })),
  ]

  const priority = { purchase: 0, production: 1, sale: 2 }
  events.sort((left, right) => (
    left.date.localeCompare(right.date)
    || priority[left.type] - priority[right.type]
    || left.createdAt.localeCompare(right.createdAt)
  ))

  for (const event of events) {
    if (event.type === 'purchase') {
      const quantity = amount(event.item.quantity_kg)
      const cost = amount(event.item.total_cost)
      if (quantity > 0 && amount(event.item.price_per_kg) <= 0) {
        issues.push({
          date: event.date,
          type: 'missing_purchase_price',
          message: `У закупки ${quantity} кг не указана цена`,
        })
      }
      rawQuantity += quantity
      rawValue += cost
      continue
    }

    if (event.type === 'production') {
      const rawUsed = amount(event.item.raw_kg_used)
      const finishedProduced = amount(event.item.finished_kg_produced)
      const rawUnitCost = rawQuantity > EPSILON
        ? rawValue / rawQuantity
        : plannedRawCost

      if (rawUsed > rawQuantity + EPSILON) {
        issues.push({
          date: event.date,
          type: 'raw_shortage',
          message: `В производство списано ${rawUsed} кг при остатке ${Math.max(0, rawQuantity)} кг`,
        })
      }
      if (rawUnitCost <= 0 && rawUsed > 0) {
        issues.push({
          date: event.date,
          type: 'missing_cost',
          message: 'Невозможно определить стоимость сырья для производства',
        })
      }

      const consumedValue = rawUsed * rawUnitCost
      const month = event.date.slice(0, 7)
      const monthlyProduced = producedByMonth.get(month) ?? 0
      const monthlyVariableExpense = variableExpenseByMonth.get(month) ?? 0
      const conversionCostPerKg = monthlyProduced > EPSILON && monthlyVariableExpense > 0
        ? monthlyVariableExpense / monthlyProduced
        : positiveOr(profile?.variable_cost_per_kg, 0)
      const conversionValue = finishedProduced * conversionCostPerKg
      rawQuantity -= rawUsed
      rawValue -= consumedValue
      if (Math.abs(rawQuantity) < EPSILON) rawQuantity = 0
      if (Math.abs(rawValue) < EPSILON) rawValue = 0
      finishedQuantity += finishedProduced
      finishedValue += consumedValue + conversionValue
      continue
    }

    const soldQuantity = amount(event.item.quantity_kg)
    const finishedUnitCost = finishedQuantity > EPSILON
      ? finishedValue / finishedQuantity
      : openingFinishedCost

    if (soldQuantity > finishedQuantity + EPSILON) {
      issues.push({
        date: event.date,
        type: 'finished_shortage',
        message: `Продано ${soldQuantity} кг при остатке ${Math.max(0, finishedQuantity)} кг`,
      })
    }
    if (finishedUnitCost <= 0 && soldQuantity > 0) {
      issues.push({
        date: event.date,
        type: 'missing_cost',
        message: 'Невозможно определить себестоимость проданной продукции',
      })
    }

    const cogs = soldQuantity * finishedUnitCost
    cogsByIncomeId[event.item.id] = cogs
    unitCostByIncomeId[event.item.id] = finishedUnitCost
    finishedQuantity -= soldQuantity
    finishedValue -= cogs
    if (Math.abs(finishedQuantity) < EPSILON) finishedQuantity = 0
    if (Math.abs(finishedValue) < EPSILON) finishedValue = 0
  }

  return {
    cogsByIncomeId,
    unitCostByIncomeId,
    rawQuantity,
    rawValue,
    rawAverageCost: rawQuantity > EPSILON ? rawValue / rawQuantity : 0,
    finishedQuantity,
    finishedValue,
    finishedAverageCost: finishedQuantity > EPSILON ? finishedValue / finishedQuantity : 0,
    issues,
  }
}

export function calculatePeriodFinance({
  incomes,
  expenses,
  personalExpenses,
  rawMaterialPurchases,
  dailyProduction,
  paymentsInPeriod = [],
  allPayments = [],
  usePaymentLedger = false,
  cogsByIncomeId,
  fallbackRawPrice = 0,
  fallbackYieldPercent = 0,
}: PeriodFinanceInput): PeriodFinance {
  const salesRevenue = incomes.reduce((sum, item) => sum + amount(item.total_amount), 0)
  const totalKgSold = incomes.reduce((sum, item) => sum + amount(item.quantity_kg), 0)

  const paidRevenue = usePaymentLedger
    ? paymentsInPeriod.reduce((sum, item) => sum + amount(item.amount), 0)
    : incomes.filter(item => item.is_paid !== false)
      .reduce((sum, item) => sum + amount(item.total_amount), 0)

  const saleIds = new Set(incomes.map(item => item.id))
  const paidAgainstSelectedSales = usePaymentLedger
    ? allPayments
      .filter(payment => saleIds.has(payment.income_id))
      .reduce((sum, item) => sum + amount(item.amount), 0)
    : paidRevenue
  const receivables = Math.max(0, salesRevenue - paidAgainstSelectedSales)

  const operatingExpenses = expenses.reduce((sum, item) => sum + amount(item.amount), 0)
  const fixedExpenses = expenses
    .filter(item => item.expense_type === 'fixed' || !item.expense_type)
    .reduce((sum, item) => sum + amount(item.amount), 0)
  const variableExpenses = operatingExpenses - fixedExpenses
  const productionVariableExpenses = expenses
    .filter(item => item.expense_type === 'production_variable' || item.expense_type === 'variable')
    .reduce((sum, item) => sum + amount(item.amount), 0)
  const inventoryPurchases = rawMaterialPurchases.reduce((sum, item) => sum + amount(item.total_cost), 0)
  const personalWithdrawals = personalExpenses.reduce((sum, item) => sum + amount(item.amount), 0)

  const pricedPurchases = rawMaterialPurchases.filter(
    item => amount(item.quantity_kg) > 0 && amount(item.price_per_kg) > 0,
  )
  const pricedKg = pricedPurchases.reduce((sum, item) => sum + amount(item.quantity_kg), 0)
  const pricedCost = pricedPurchases.reduce((sum, item) => sum + amount(item.total_cost), 0)
  const averageRawPurchasePrice = pricedKg > 0 ? pricedCost / pricedKg : null

  const rawUsed = dailyProduction.reduce((sum, item) => sum + amount(item.raw_kg_used), 0)
  const finishedProduced = dailyProduction.reduce(
    (sum, item) => sum + amount(item.finished_kg_produced),
    0,
  )
  const actualYieldPercent = rawUsed > 0 ? (finishedProduced / rawUsed) * 100 : null
  const effectiveRawPrice = averageRawPurchasePrice ?? (fallbackRawPrice > 0 ? fallbackRawPrice : null)
  const effectiveYield = actualYieldPercent ?? (fallbackYieldPercent > 0 ? fallbackYieldPercent : null)
  const rawCostPerFinishedKg = effectiveRawPrice !== null && effectiveYield !== null && effectiveYield > 0
    ? effectiveRawPrice / (effectiveYield / 100)
    : null

  const hasLedgerCost = cogsByIncomeId !== undefined
  const estimatedCostOfGoodsSold = hasLedgerCost
    ? incomes.reduce((sum, item) => sum + amount(cogsByIncomeId[item.id]), 0)
    : rawCostPerFinishedKg === null ? 0 : totalKgSold * rawCostPerFinishedKg
  const calculationReady = totalKgSold === 0
    || (hasLedgerCost
      ? incomes.every(item => amount(cogsByIncomeId[item.id]) > 0)
      : rawCostPerFinishedKg !== null)

  const grossProfit = salesRevenue - estimatedCostOfGoodsSold
  // При точном складском расчёте переменные производственные расходы уже
  // включены в себестоимость проданного. Повторно списывать их нельзя.
  const recognizedOperatingExpenses = hasLedgerCost
    ? operatingExpenses - (finishedProduced > EPSILON ? productionVariableExpenses : 0)
    : operatingExpenses
  const totalAccountingExpenses = recognizedOperatingExpenses + estimatedCostOfGoodsSold
  const estimatedNetProfit = grossProfit - recognizedOperatingExpenses
  const cashResult = paidRevenue - operatingExpenses - inventoryPurchases
  const cashAfterPersonal = cashResult - personalWithdrawals

  return {
    salesRevenue,
    paidRevenue,
    receivables,
    operatingExpenses,
    recognizedOperatingExpenses,
    fixedExpenses,
    variableExpenses,
    inventoryPurchases,
    estimatedCostOfGoodsSold,
    grossProfit,
    totalAccountingExpenses,
    estimatedNetProfit,
    cashResult,
    cashAfterPersonal,
    personalWithdrawals,
    totalKgSold,
    averageRawPurchasePrice,
    actualYieldPercent,
    rawCostPerFinishedKg,
    calculationReady,
  }
}

export function calculateTrend(current: number, previous: number): number | undefined {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return undefined
  return ((current - previous) / Math.abs(previous)) * 100
}

export function localDateInputValue(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
