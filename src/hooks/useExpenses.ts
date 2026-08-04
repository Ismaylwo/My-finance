import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Expense, ExpenseInsert } from '../types'

export function useExpenses() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (error) setError(error.message)
    else setExpenses(data as Expense[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (item: ExpenseInsert) => {
    if (!user) return { error: 'Не авторизован' }
    const { error } = await supabase
      .from('expenses')
      .insert({ ...item, user_id: user.id })
    if (!error) await fetch()
    return { error: error?.message ?? null }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (!error) await fetch()
    return { error: error?.message ?? null }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return { expenses, loading, error, add, remove, refetch: fetch, total }
}
