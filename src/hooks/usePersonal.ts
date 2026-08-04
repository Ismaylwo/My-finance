import { useAppContext } from './useAppContext'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { PersonalExpenseInsert } from '../types'

export function usePersonal() {
  const { user } = useAuth()
  const { personalExpenses: items, setPersonalExpenses: setItems, loading, error, refetchAll } = useAppContext()

  const add = async (item: PersonalExpenseInsert) => {
    if (!user) return { error: 'Не авторизован' }
    const { data, error } = await supabase
      .from('personal_expenses')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()
      
    if (!error && data) {
      setItems(prev => [data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } else {
      await refetchAll(false)
    }
    return { error: error?.message ?? null }
  }

  const remove = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    const { error } = await supabase.from('personal_expenses').delete().eq('id', id)
    if (error) await refetchAll(false)
    return { error: error?.message ?? null }
  }

  const total = items.reduce((s, i) => s + i.amount, 0)

  return { items, loading, error, add, remove, refetch: () => refetchAll(true), total }
}
