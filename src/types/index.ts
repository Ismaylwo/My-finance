// ─── Пользователь ───────────────────────────────────────────────
export interface Profile {
  id: string
  user_id: string
  business_name: string
  raw_purchase_price_per_kg: number // Цена закупки исходного сырья (сом/кг), например 2.50
  yield_percent: number            // Выход готовой продукции (%), например 90.00%
  selling_price_per_kg: number      // Цена продажи готового сырья (сом/кг), например 6.50
  desired_profit: number            // Сохраняемая желаемая чистая прибыль (сом), например 10000.00
  created_at: string
  updated_at: string
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

// ─── Бизнес расходы ─────────────────────────────────────────────
export type ExpenseType = 'fixed' | 'variable'

export interface Expense {
  id: string
  user_id: string
  date: string
  amount: number                     // сумма (TJS)
  category: string
  description: string | null
  type?: ExpenseType
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
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  totalPersonal: number
  netProfit: number
  totalKgSold: number
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
  return new Date(dateStr).toLocaleDateString('ru-RU', {
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
