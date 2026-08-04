import { useAppContext } from './useAppContext'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { IncomeInsert } from '../types'

export function useIncome() {
  const { user } = useAuth()
  const { incomes, setIncomes, loading, error, refetchAll } = useAppContext()

  const add = async (item: IncomeInsert) => {
    if (!user) return { error: 'Не авторизован' }
    const { data, error } = await supabase
      .from('income')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()
      
    if (!error && data) {
      setIncomes(prev => [data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } else {
      await refetchAll(false)
    }
    return { error: error?.message ?? null }
  }

  const remove = async (id: string) => {
    // Оптимистичное удаление
    setIncomes(prev => prev.filter(i => i.id !== id))
    const { error } = await supabase.from('income').delete().eq('id', id)
    if (error) await refetchAll(false)
    return { error: error?.message ?? null }
  }

  const togglePaid = async (id: string, is_paid: boolean) => {
    // Оптимистичное обновление
    setIncomes(prev => prev.map(item => item.id === id ? { ...item, is_paid } : item))
    const { error } = await supabase.from('income').update({ is_paid }).eq('id', id)
    if (error) await refetchAll(false)
    return { error: error?.message ?? null }
  }

  const totalAmount = incomes.reduce((s, i) => s + i.total_amount, 0)
  const totalKg = incomes.reduce((s, i) => s + i.quantity_kg, 0)
  const totalPaid = incomes.filter(i => i.is_paid !== false).reduce((s, i) => s + i.total_amount, 0)
  const totalUnpaid = incomes.filter(i => i.is_paid === false).reduce((s, i) => s + i.total_amount, 0)

  return { incomes, loading, error, add, remove, togglePaid, refetch: () => refetchAll(true), totalAmount, totalKg, totalPaid, totalUnpaid }
}
