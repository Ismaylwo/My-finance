import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Profile, Income, Expense, PersonalExpense } from '../types'

interface AppContextType {
  profile: Profile | null
  incomes: Income[]
  expenses: Expense[]
  personalExpenses: PersonalExpense[]
  loading: boolean
  error: string | null
  
  // Actions
  refetchAll: (showLoading?: boolean) => Promise<void>
  updateProfile: (updates: Partial<Pick<Profile, 'business_name' | 'raw_purchase_price_per_kg' | 'yield_percent' | 'selling_price_per_kg' | 'desired_profit'>>) => Promise<void>
  resetEntireBusiness: () => Promise<void>
  setIncomes: React.Dispatch<React.SetStateAction<Income[]>>
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
  setPersonalExpenses: React.Dispatch<React.SetStateAction<PersonalExpense[]>>
}

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

const DEFAULT_PROFILE: Profile = {
  id: '',
  user_id: '',
  business_name: '',
  raw_purchase_price_per_kg: 0,
  yield_percent: 0,
  selling_price_per_kg: 0,
  desired_profit: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [personalExpenses, setPersonalExpenses] = useState<PersonalExpense[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async (showLoading = true) => {
    if (!user) {
      setProfile(null)
      setIncomes([])
      setExpenses([])
      setPersonalExpenses([])
      setLoading(false)
      return
    }

    if (showLoading) setLoading(true)
    setError(null)

    try {
      // Загружаем сразу всё
      const [profRes, incRes, expRes, perRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('income').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('personal_expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      ])

      if (profRes.error && profRes.error.code !== 'PGRST116') throw profRes.error
      
      setProfile((profRes.data as Profile) || null)
      setIncomes((incRes.data || []) as Income[])
      setExpenses((expRes.data || []) as Expense[])
      setPersonalExpenses((perRes.data || []) as PersonalExpense[])
    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Загружаем данные при смене юзера
  useEffect(() => {
    if (authLoading) return // Ждём пока auth загрузится
    fetchAll()
  }, [fetchAll, authLoading])

  const updateProfile = async (updates: Partial<Pick<Profile, 'business_name' | 'raw_purchase_price_per_kg' | 'yield_percent' | 'selling_price_per_kg' | 'desired_profit'>>) => {
    if (!user) return

    const current = profile || { ...DEFAULT_PROFILE, user_id: user.id }
    const updated: Profile = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    
    // Оптимистичное обновление
    setProfile(updated)

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          business_name: updated.business_name || null,
          raw_purchase_price_per_kg: updated.raw_purchase_price_per_kg ?? 0,
          yield_percent: updated.yield_percent ?? 0,
          selling_price_per_kg: updated.selling_price_per_kg ?? 0,
          desired_profit: updated.desired_profit ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('Ошибка сохранения профиля:', error.message)
      await fetchAll(false) // Окат к реальным данным при ошибке
    }
  }

  const resetEntireBusiness = async () => {
    if (!user) return

    await Promise.all([
      supabase.from('income').delete().eq('user_id', user.id),
      supabase.from('expenses').delete().eq('user_id', user.id),
      supabase.from('personal_expenses').delete().eq('user_id', user.id),
      supabase.from('profiles').delete().eq('user_id', user.id),
    ])

    setProfile(null)
    setIncomes([])
    setExpenses([])
    setPersonalExpenses([])
  }

  const value = {
    profile,
    incomes,
    expenses,
    personalExpenses,
    loading: authLoading || loading,
    error,
    refetchAll: fetchAll,
    updateProfile,
    resetEntireBusiness,
    setIncomes,
    setExpenses,
    setPersonalExpenses
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
