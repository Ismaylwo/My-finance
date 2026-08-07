// ─── Пользователь ───────────────────────────────────────────────
export interface Profile {
  id: string
  user_id: string
  business_name: string
  raw_purchase_price_per_kg: number // Цена закупки исходного сырья (сом/кг)
  yield_percent: number             // Выход готовой продукции (%)
  selling_price_per_kg: number      // Цена продажи готового сырья (сом/кг)
  desired_profit: number            // Целевая чистая прибыль (сом)
  // v2 fields
  daily_capacity_kg: number         // Производительность в день (кг/день)
  initial_raw_kg: number            // Начальный остаток неготового сырья
  initial_finished_kg: number       // Начальный остаток готового сырья
  initial_raw_cost_per_kg: number   // Стоимость 1 кг начального остатка сырья
  initial_finished_cost_per_kg: number // Стоимость 1 кг начального остатка готовой продукции
  variable_cost_per_kg: number      // Плановые переменные затраты на 1 кг готовой продукции
  created_at: string
  updated_at: string
}

// ─── Дневной журнал производства (v2) ────────────────────────────
export interface DailyProduction {
  id: string
  user_id: string
  date: string                       // ISO date 'YYYY-MM-DD'
  raw_kg_used: number                // Загружено неготового сырья (кг)
  finished_kg_produced: number       // Вышло готового сырья (кг)
  notes: string | null
  created_at: string
  updated_at: string
}

export type DailyProductionInsert = Omit<DailyProduction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type DailyProductionUpsert = Omit<DailyProduction, 'id' | 'user_id' | 'created_at' | 'updated_at'>

// ─── Закупки сырья — только для учёта кг на складе (v2) ──────────
export interface RawMaterialPurchase {
  id: string
  user_id: string
  date: string
  quantity_kg: number                // Кол-во закупленного сырья (кг)
  price_per_kg: number               // Цена за кг
  total_cost: number                 // Итого = quantity_kg × price_per_kg
  supplier: string | null
  notes: string | null
  created_at: string
}

export type RawMaterialPurchaseInsert = Omit<RawMaterialPurchase, 'id' | 'user_id' | 'total_cost' | 'created_at'>

// ─── Склад — остатки (вычисляется на клиенте) (v2) ──────────────
export interface WarehouseBalance {
  raw_kg_balance: number             // Остаток неготового сырья (кг)
  finished_kg_balance: number        // Остаток готового сырья (кг)
}

// ─── Темп производства (v2) ──────────────────────────────────────
export type PaceStatus = 'ahead' | 'on_track' | 'behind' | 'no_data'

export interface ProductionPace {
  totalProducedThisMonth: number     // Уже произведено в этом месяце (кг)
  totalSoldThisMonth: number         // Продано в выбранном периоде (финансовый прогресс)
  daysWorked: number                 // Количество отработанных дней (смен)

  // Метрики для Точки 0
  initialDaysToBreakEven: number | null
  actualDaysToBreakEven: number | null
  breakEvenDiffDays: number | null
  breakEvenStatus: PaceStatus

  // Метрики для Целевой прибыли
  initialDaysToTarget: number | null
  actualDaysToTarget: number | null
  targetDiffDays: number | null
  targetStatus: PaceStatus
  progressPercent: number            // % от цели месяца (0–100+)
  realYieldPercent: number | null    // Фактический выход сырья в этом месяце (%)
  realRawPurchasePrice: number | null // Средневзвешенная стоимость сырья на складе (в этом месяце)
  actualBreakEvenResult: BreakEvenResult | null // Динамическая Точка 0 на базе реальных данных склада
}


// ─── Доходы (продажи готового сырья) ──────────────────────────────────
export interface Income {
  id: string
  user_id: string
  date: string                       // ISO date string
  quantity_kg: number                // количество кг готовой продукции
  price_per_kg: number               // цена за кг (TJS)
  total_amount: number               // итого (TJS) = quantity_kg × price_per_kg
  description: string | null
  is_paid: boolean                   // true = Оплачено, false = В долг
  client_name: string | null         // Имя покупателя при продаже в долг
  created_at: string
}

export type IncomeInsert = Omit<Income, 'id' | 'user_id' | 'total_amount' | 'created_at'>

export interface IncomePayment {
  id: string
  user_id: string
  income_id: string
  date: string
  amount: number
  notes: string | null
  created_at: string
}

export type IncomePaymentInsert = Omit<IncomePayment, 'id' | 'user_id' | 'created_at'>

// ─── Бизнес расходы ─────────────────────────────────────────────

export interface Expense {
  id: string
  user_id: string
  date: string
  amount: number                     // сумма (TJS)
  category: string
  expense_type: 'fixed' | 'production_variable' | 'selling_variable' | 'variable'
  description: string | null
  created_at: string
}

export type ExpenseInsert = Omit<Expense, 'id' | 'user_id' | 'created_at'>

// ─── Личные расходы ─────────────────────────────────────────────
export interface PersonalExpense {
  id: string
  user_id: string
  date: string
  amount: number                     // сумма (TJS)
  category: string
  description: string | null
  created_at: string
}

export type PersonalExpenseInsert = Omit<PersonalExpense, 'id' | 'user_id' | 'created_at'>

// ─── Аналитика / агрегация ───────────────────────────────────────
export interface MonthlySummary {
  month: string                      // 'YYYY-MM'
  total_income: number
  total_expenses: number
  total_personal: number
  net_profit: number
  total_kg_sold: number
  paid_income: number
  receivables: number
  operating_expenses: number
  recognized_operating_expenses: number
  inventory_purchases: number
  estimated_cogs: number
  cash_result: number
  cash_after_personal: number
  gross_profit: number
  calculation_ready: boolean
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  totalPersonal: number
  netProfit: number
  totalKgSold: number
  paidIncome: number
  receivables: number
  totalReceivables: number
  operatingExpenses: number
  inventoryPurchases: number
  estimatedCogs: number
  cashResult: number
  cashAfterPersonal: number
  grossProfit: number
  rawInventoryValue: number
  finishedInventoryValue: number
  calculationReady: boolean
  incomeTrend?: number                // % прироста выручки по сравнению с прошлым месяцем
  expenseTrend?: number               // % прироста расходов по сравнению с прошлым месяцем
  profitTrend?: number                // % прироста чистой прибыли по сравнению с прошлым месяцем
}

// ─── Точка безубыточности и Себестоимость ─────────────────────────
export interface BreakEvenResult {
  rawPurchasePricePerKg: number      // Цена закупки исходного сырья (например 2.50)
  yieldPercent: number               // Процент выхода готового сырья (например 90%)
  realRawCostPerKg: number           // Реальная себестоимость сырья = 2.50 / 0.90 = 2.78 сом/кг
  sellingPricePerKg: number          // Цена продажи готового сырья (например 6.50)
  marginPerKg: number                // Маржинальный доход с 1 кг = 6.50 - 2.78 = 3.72 сом/кг
  variableCostPerKg: number          // Переменные затраты на 1 кг помимо сырья
  businessExpenses: number           // Все расходы бизнеса за месяц (аренда, зп, коммуналка...)
  desiredProfit: number              // Сохранённая целевая прибыль (сом)

  // Объёмы в точке безубыточности (Точка 0):
  breakEvenFinishedKg: number        // Объём ГОТОВОГО сырья для точки 0 (кг)
  breakEvenRawKg: number             // Сколько ИСХОДНОГО сырья закупить для точки 0 (кг)
  breakEvenRevenue: number           // Выручка в точке 0 (сом)

  // Объёмы для целевой прибыли:
  targetFinishedKg: number           // Объём ГОТОВОГО сырья для целевой прибыли (кг)
  targetRawKg: number                // Сколько ИСХОДНОГО сырья закупить для целевой прибыли (кг)
  targetRevenue: number              // Необходимая выручка (сом)

  // Полная себестоимость единицы продукции:
  businessExpensePerKg: number       // Доля расходов бизнеса в 1 кг готового сырья
  fullCostPerKg: number              // ПОЛНАЯ себестоимость 1 кг = Сырьё + Расходы бизнеса
  netProfitPerKg: number             // ЧИСТАЯ прибыль с 1 кг = Цена - Полная себестоимость
}

// ─── Категории ───────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  'Аренда',
  'Зарплата',
  'Коммунальные услуги',
  'Транспорт',
  'Упаковка',
  'Оборудование',
  'Реклама',
  'Налоги',
  'Прочее',
] as const

export const PERSONAL_CATEGORIES = [
  'Продукты',
  'Коммунальные услуги',
  'Транспорт',
  'Медицина',
  'Одежда',
  'Развлечения',
  'Образование',
  'Семья',
  'Прочее',
] as const

// ─── Вспомогательные ────────────────────────────────────────────
export const CURRENCY = 'сом'       // TJS символ

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-TJ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + CURRENCY
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number)
  const date = year && month && day ? new Date(year, month - 1, day) : new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatKg(kg: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(kg) + ' кг'
}
