import { useMemo } from 'react'
import { useAppContext } from './useAppContext'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { IncomeInsert, IncomePaymentInsert } from '../types'
import { localDateInputValue } from '../lib/finance'

export function useIncome() {
  const { user } = useAuth()
  const {
    incomes,
    incomePayments,
    paymentsAvailable,
    setIncomes,
    setIncomePayments,
    loading,
    error,
    refetchAll,
  } = useAppContext()

  const paidByIncome = useMemo(() => {
    const result: Record<string, number> = {}
    incomePayments.forEach(payment => {
      result[payment.income_id] = (result[payment.income_id] || 0) + Number(payment.amount)
    })
    return result
  }, [incomePayments])

  const paidForIncome = (id: string) => paymentsAvailable
    ? paidByIncome[id] || 0
    : Number(incomes.find(item => item.id === id)?.is_paid ? incomes.find(item => item.id === id)?.total_amount : 0)

  const outstandingForIncome = (id: string) => {
    const sale = incomes.find(item => item.id === id)
    return sale ? Math.max(0, Number(sale.total_amount) - paidForIncome(id)) : 0
  }

  const add = async (item: IncomeInsert, initialPayment?: number) => {
    if (!user) return { error: 'Не авторизован' }
    const total = Number(item.quantity_kg) * Number(item.price_per_kg)
    const payment = initialPayment ?? (item.is_paid ? total : 0)

    if (paymentsAvailable) {
      const { error: rpcError } = await supabase.rpc('record_sale', {
        p_date: item.date,
        p_quantity_kg: item.quantity_kg,
        p_price_per_kg: item.price_per_kg,
        p_description: item.description || null,
        p_client_name: item.client_name || null,
        p_initial_payment: payment,
      })
      await refetchAll(false)
      return { error: rpcError?.message ?? null }
    }

    const { data, error: insertError } = await supabase
      .from('income')
      .insert({ ...item, is_paid: payment >= total, user_id: user.id })
      .select()
      .single()
    if (!insertError && data) {
      setIncomes(previous => [data, ...previous].sort((a, b) => b.date.localeCompare(a.date)))
    }
    return { error: insertError?.message ?? null }
  }

  const addPayment = async (item: Omit<IncomePaymentInsert, 'user_id'>) => {
    if (!user) return { error: 'Не авторизован' }
    if (!paymentsAvailable) return { error: 'Сначала выполните FULL_SETUP_NEW_PROJECT.sql в новой Supabase' }
    const { data, error: paymentError } = await supabase
      .from('income_payments')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()
    if (!paymentError && data) {
      setIncomePayments(previous => [data, ...previous].sort((a, b) => b.date.localeCompare(a.date)))
      setIncomes(previous => previous.map(sale => sale.id === item.income_id
        ? { ...sale, is_paid: outstandingForIncome(sale.id) - Number(item.amount) <= 0.005 }
        : sale))
    } else if (paymentError) {
      await refetchAll(false)
    }
    return { error: paymentError?.message ?? null }
  }

  const remove = async (id: string) => {
    setIncomes(previous => previous.filter(item => item.id !== id))
    setIncomePayments(previous => previous.filter(item => item.income_id !== id))
    const { error: removeError } = await supabase.from('income').delete().eq('id', id)
    if (removeError) await refetchAll(false)
    return { error: removeError?.message ?? null }
  }

  const togglePaid = async (id: string, targetPaid: boolean) => {
    if (!paymentsAvailable) {
      setIncomes(previous => previous.map(item => item.id === id ? { ...item, is_paid: targetPaid } : item))
      const { error: updateError } = await supabase.from('income').update({ is_paid: targetPaid }).eq('id', id)
      if (updateError) await refetchAll(false)
      return { error: updateError?.message ?? null }
    }
    if (targetPaid) {
      const outstanding = outstandingForIncome(id)
      if (outstanding <= 0) return { error: null }
      return addPayment({
        income_id: id,
        date: localDateInputValue(),
        amount: outstanding,
        notes: 'Полное погашение',
      })
    }
    const { error: deleteError } = await supabase.from('income_payments').delete().eq('income_id', id)
    await refetchAll(false)
    return { error: deleteError?.message ?? null }
  }

  const totalAmount = incomes.reduce((sum, item) => sum + Number(item.total_amount), 0)
  const totalKg = incomes.reduce((sum, item) => sum + Number(item.quantity_kg), 0)
  const totalPaid = paymentsAvailable
    ? incomePayments.reduce((sum, item) => sum + Number(item.amount), 0)
    : incomes.filter(item => item.is_paid !== false).reduce((sum, item) => sum + Number(item.total_amount), 0)
  const totalUnpaid = Math.max(0, totalAmount - Object.values(paidByIncome).reduce((sum, value) => sum + value, 0))

  return {
    incomes,
    incomePayments,
    paymentsAvailable,
    loading,
    error,
    add,
    addPayment,
    remove,
    togglePaid,
    paidForIncome,
    outstandingForIncome,
    refetch: () => refetchAll(true),
    totalAmount,
    totalKg,
    totalPaid,
    totalUnpaid: paymentsAvailable ? totalUnpaid : totalAmount - totalPaid,
  }
}
