import { useAppContext } from './useAppContext'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { ExpenseInsert } from '../types'

export function useExpenses() {
  const { user } = useAuth()
  const { expenses, setExpenses, loading, error, refetchAll } = useAppContext()

  const add = async (item: ExpenseInsert) => {
    if (!user) return { error: 'Не авторизован' }
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()
      
    if (!error && data) {
      setExpenses(prev => [data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } else {
      await refetchAll(false)
    }
    return { error: error?.message ?? null }
  }

  const remove = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) await refetchAll(false)
    return { error: error?.message ?? null }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return { expenses, loading, error, add, remove, refetch: () => refetchAll(true), total }
}
