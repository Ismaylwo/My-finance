import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { PersonalExpense, PersonalExpenseInsert } from '../types'

export function usePersonal() {
  const { user } = useAuth()
  const [items, setItems] = useState<PersonalExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('personal_expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (error) setError(error.message)
    else setItems(data as PersonalExpense[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (item: PersonalExpenseInsert) => {
    if (!user) return { error: 'Не авторизован' }
    const { error } = await supabase
      .from('personal_expenses')
      .insert({ ...item, user_id: user.id })
    if (!error) await fetch()
    return { error: error?.message ?? null }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('personal_expenses').delete().eq('id', id)
    if (!error) await fetch()
    return { error: error?.message ?? null }
  }

  const total = items.reduce((s, i) => s + i.amount, 0)

  return { items, loading, error, add, remove, refetch: fetch, total }
}
