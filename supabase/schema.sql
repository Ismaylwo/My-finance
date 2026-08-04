-- ============================================================
-- Business Dashboard — Supabase Schema (Упрощённый учет сырья)
-- Валюта: TJS (сомони) | Продукт: переработка сырья
-- ============================================================

-- 1. Профиль бизнеса (чистый старт без дефолтных значений)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name             TEXT,                                  -- Пустое значение при регистрации (для Onboarding)
  raw_purchase_price_per_kg NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- 0 при регистрации
  yield_percent             NUMERIC(5,2)  NOT NULL DEFAULT 0.00,  -- 0 при регистрации
  selling_price_per_kg      NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- 0 при регистрации
  desired_profit            NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- 0 при регистрации
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- 2. Доходы (продажи готового сырья) + Учёт долгов
CREATE TABLE IF NOT EXISTS public.income (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_kg   NUMERIC(12,3) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg  NUMERIC(12,2) NOT NULL CHECK (price_per_kg > 0),
  total_amount  NUMERIC(14,2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
  description   TEXT,
  is_paid       BOOLEAN NOT NULL DEFAULT true,  -- true = Оплачено, false = В долг
  client_name   TEXT,                            -- Имя покупателя при продаже в долг
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Расходы бизнеса (Аренда, Зарплата, Коммуналка и т.д.)
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  description TEXT,
  type        TEXT DEFAULT 'fixed',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Личные расходы (Отдельно от бизнеса)
CREATE TABLE IF NOT EXISTS public.personal_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ИНДЕКСЫ ДЛЯ МОЛНИЕНОСНЫХ ЗАПРОСОВ (B-Tree Instant Index Scans)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_income_user_date ON public.income(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_expenses_user_date ON public.personal_expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- RLS Политики
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Income Policies
DROP POLICY IF EXISTS "Users can view own income" ON public.income;
CREATE POLICY "Users can view own income" ON public.income FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own income" ON public.income;
CREATE POLICY "Users can insert own income" ON public.income FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own income" ON public.income;
CREATE POLICY "Users can update own income" ON public.income FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own income" ON public.income;
CREATE POLICY "Users can delete own income" ON public.income FOR DELETE USING (auth.uid() = user_id);

-- Expenses Policies
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Personal Expenses Policies
DROP POLICY IF EXISTS "Users can view own personal expenses" ON public.personal_expenses;
CREATE POLICY "Users can view own personal expenses" ON public.personal_expenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own personal expenses" ON public.personal_expenses;
CREATE POLICY "Users can insert own personal expenses" ON public.personal_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own personal expenses" ON public.personal_expenses;
CREATE POLICY "Users can delete own personal expenses" ON public.personal_expenses FOR DELETE USING (auth.uid() = user_id);

-- Автосоздание профиля при регистрации без дефолтных забитых данных
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, business_name, raw_purchase_price_per_kg, yield_percent, selling_price_per_kg, desired_profit)
  VALUES (NEW.id, NULL, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
