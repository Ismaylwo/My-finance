import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Income, IncomeInsert } from '../types'

export function useIncome() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (error) setError(error.message)
    else setIncomes(data as Income[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (item: IncomeInsert) => {
    if (!user) return { error: 'Не авторизован' }
    const { error } = await supabase
      .from('income')
      .insert({ ...item, user_id: user.id })
    if (!error) await fetch()
    return { error: error?.message ?? null }
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('income').delete().eq('id', id)
    if (!error) await fetch()
    return { error: error?.message ?? null }
  }

  const togglePaid = async (id: string, is_paid: boolean) => {
    // Оптимистичное обновление
    setIncomes(prev => prev.map(item => item.id === id ? { ...item, is_paid } : item))
    const { error } = await supabase.from('income').update({ is_paid }).eq('id', id)
    if (error) await fetch()
    return { error: error?.message ?? null }
  }

  const totalAmount = incomes.reduce((s, i) => s + i.total_amount, 0)
  const totalKg = incomes.reduce((s, i) => s + i.quantity_kg, 0)
  const totalPaid = incomes.filter(i => i.is_paid !== false).reduce((s, i) => s + i.total_amount, 0)
  const totalUnpaid = incomes.filter(i => i.is_paid === false).reduce((s, i) => s + i.total_amount, 0)

  return { incomes, loading, error, add, remove, togglePaid, refetch: fetch, totalAmount, totalKg, totalPaid, totalUnpaid }
}
