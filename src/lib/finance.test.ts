import { describe, expect, it } from 'vitest'
import { calculateInventoryLedger, calculatePeriodFinance, calculateTrend, localDateInputValue } from './finance'
import type { DailyProduction, Expense, Income, IncomePayment, Profile, RawMaterialPurchase } from '../types'

const sale = (total: number, quantity: number, paid = true, date = '2026-08-01'): Income => ({
  id: crypto.randomUUID(), user_id: 'u', date, quantity_kg: quantity,
  price_per_kg: total / quantity, total_amount: total, description: null,
  is_paid: paid, client_name: null, created_at: '2026-08-01',
})

const expense = (value: number, type: Expense['expense_type'] = 'fixed'): Expense => ({
  id: crypto.randomUUID(), user_id: 'u', date: '2026-08-01', amount: value,
  category: 'Аренда', expense_type: type, description: null, created_at: '2026-08-01',
})

const purchase = (quantity: number, price: number, date = '2026-08-01'): RawMaterialPurchase => ({
  id: crypto.randomUUID(), user_id: 'u', date, quantity_kg: quantity,
  price_per_kg: price, total_cost: quantity * price, supplier: null, notes: null,
  created_at: '2026-08-01',
})

const production = (raw: number, finished: number, date = '2026-08-01'): DailyProduction => ({
  id: crypto.randomUUID(), user_id: 'u', date, raw_kg_used: raw,
  finished_kg_produced: finished, notes: null, created_at: '2026-08-01', updated_at: '2026-08-01',
})

const profile: Profile = {
  id: 'p', user_id: 'u', business_name: 'Test', raw_purchase_price_per_kg: 2,
  yield_percent: 80, selling_price_per_kg: 10, desired_profit: 1000,
  daily_capacity_kg: 100, initial_raw_kg: 0, initial_finished_kg: 0,
  initial_raw_cost_per_kg: 0, initial_finished_cost_per_kg: 0, variable_cost_per_kg: 0,
  created_at: '2026-08-01', updated_at: '2026-08-01',
}

describe('calculatePeriodFinance', () => {
  it('separates profit from cash movement and receivables', () => {
    const result = calculatePeriodFinance({
      incomes: [sale(650, 100, true), sale(325, 50, false)],
      expenses: [expense(100)],
      personalExpenses: [],
      rawMaterialPurchases: [purchase(1000, 2.5)],
      dailyProduction: [production(100, 90)],
    })

    // Cost of one finished kg: 2.50 / 90% = 2.777...
    expect(result.rawCostPerFinishedKg).toBeCloseTo(2.777777, 5)
    expect(result.estimatedCostOfGoodsSold).toBeCloseTo(416.666666, 5)
    expect(result.estimatedNetProfit).toBeCloseTo(458.333333, 5)
    expect(result.receivables).toBe(325)
    // Cash: only paid 650 - rent 100 - full stock purchase 2500.
    expect(result.cashResult).toBe(-1950)
  })

  it('uses configured cost assumptions when the period has no production or purchases', () => {
    const result = calculatePeriodFinance({
      incomes: [sale(650, 100)],
      expenses: [expense(100)],
      personalExpenses: [],
      rawMaterialPurchases: [],
      dailyProduction: [],
      fallbackRawPrice: 2.5,
      fallbackYieldPercent: 80,
    })

    expect(result.calculationReady).toBe(true)
    expect(result.estimatedCostOfGoodsSold).toBe(312.5)
    expect(result.estimatedNetProfit).toBe(237.5)
  })

  it('does not treat a purchase without price as free raw material', () => {
    const result = calculatePeriodFinance({
      incomes: [sale(100, 10)],
      expenses: [],
      personalExpenses: [],
      rawMaterialPurchases: [purchase(100, 0)],
      dailyProduction: [],
    })

    expect(result.calculationReady).toBe(false)
    expect(result.rawCostPerFinishedKg).toBeNull()
  })

  it('uses payment dates for cash and supports partial receivables', () => {
    const invoice = sale(1000, 100, false)
    const payments: IncomePayment[] = [
      { id: 'p1', user_id: 'u', income_id: invoice.id, date: '2026-08-02', amount: 400, notes: null, created_at: '2026-08-02' },
    ]
    const result = calculatePeriodFinance({
      incomes: [invoice], expenses: [], personalExpenses: [], rawMaterialPurchases: [], dailyProduction: [],
      paymentsInPeriod: payments, allPayments: payments, usePaymentLedger: true,
      fallbackRawPrice: 2, fallbackYieldPercent: 80,
    })
    expect(result.paidRevenue).toBe(400)
    expect(result.receivables).toBe(600)
    expect(result.cashResult).toBe(400)
  })
})

describe('calculateInventoryLedger', () => {
  it('calculates perpetual weighted-average raw and finished inventory cost', () => {
    const firstPurchase = purchase(1000, 2, '2026-08-01')
    const firstProduction = production(500, 400, '2026-08-02')
    const secondPurchase = purchase(500, 4, '2026-08-03')
    const secondProduction = production(500, 400, '2026-08-04')
    const invoice = sale(1600, 160, true, '2026-08-05')
    const ledger = calculateInventoryLedger({
      profile,
      incomes: [invoice],
      rawMaterialPurchases: [firstPurchase, secondPurchase],
      dailyProduction: [firstProduction, secondProduction],
    })

    expect(ledger.cogsByIncomeId[invoice.id]).toBeCloseTo(500, 5)
    expect(ledger.finishedQuantity).toBeCloseTo(640, 5)
    expect(ledger.finishedValue).toBeCloseTo(2000, 5)
    expect(ledger.rawQuantity).toBeCloseTo(500, 5)
    expect(ledger.rawValue).toBeCloseTo(1500, 5)
    expect(ledger.issues).toHaveLength(0)
  })

  it('capitalizes variable production costs and recognizes them through sold goods', () => {
    const invoice = sale(1000, 100, true, '2026-08-03')
    const variableExpense = expense(200, 'production_variable')
    const sellingExpense = expense(50, 'selling_variable')
    const fixedExpense = expense(100)
    const purchases = [purchase(500, 2, '2026-08-01')]
    const productions = [production(500, 400, '2026-08-02')]
    const ledger = calculateInventoryLedger({
      profile,
      incomes: [invoice],
      expenses: [variableExpense, sellingExpense, fixedExpense],
      rawMaterialPurchases: purchases,
      dailyProduction: productions,
    })
    const result = calculatePeriodFinance({
      incomes: [invoice],
      expenses: [variableExpense, sellingExpense, fixedExpense],
      personalExpenses: [],
      rawMaterialPurchases: purchases,
      dailyProduction: productions,
      cogsByIncomeId: ledger.cogsByIncomeId,
    })

    expect(ledger.cogsByIncomeId[invoice.id]).toBe(300)
    expect(ledger.finishedQuantity).toBe(300)
    expect(ledger.finishedValue).toBe(900)
    expect(result.recognizedOperatingExpenses).toBe(150)
    expect(result.estimatedNetProfit).toBe(550)
    expect(result.cashResult).toBe(-350)
  })
})

describe('helpers', () => {
  it('calculates trend across a negative previous value', () => {
    expect(calculateTrend(100, -100)).toBe(200)
  })

  it('formats form dates in local time', () => {
    expect(localDateInputValue(new Date(2026, 7, 7, 0, 15))).toBe('2026-08-07')
  })
})
