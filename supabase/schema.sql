-- ============================================================
-- Business Dashboard v2 — ПОЛНАЯ СХЕМА (С ИДЕАЛЬНЫМИ ПРАВАМИ)
-- ============================================================

-- 0. БЕЗОПАСНАЯ ОЧИСТКА СТАРЫХ ТАБЛИЦ (БЕЗ УДАЛЕНИЯ СХЕМЫ)
DROP VIEW IF EXISTS public.warehouse_balance CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.income CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.personal_expenses CASCADE;
DROP TABLE IF EXISTS public.daily_production CASCADE;
DROP TABLE IF EXISTS public.raw_material_purchases CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- 1. Профиль бизнеса
CREATE TABLE IF NOT EXISTS public.profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name             TEXT,
  raw_purchase_price_per_kg NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  yield_percent             NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
  selling_price_per_kg      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  desired_profit            NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  daily_capacity_kg         NUMERIC(12,3) NOT NULL DEFAULT 0,
  initial_raw_kg            NUMERIC(12,3) NOT NULL DEFAULT 0,
  initial_finished_kg       NUMERIC(12,3) NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- 2. Доходы
CREATE TABLE IF NOT EXISTS public.income (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_kg   NUMERIC(12,3) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg  NUMERIC(12,2) NOT NULL CHECK (price_per_kg > 0),
  total_amount  NUMERIC(14,2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
  description   TEXT,
  is_paid       BOOLEAN NOT NULL DEFAULT true,
  client_name   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Расходы (Бизнес)
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Личные расходы
CREATE TABLE IF NOT EXISTS public.personal_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. Дневное производство (Журнал)
CREATE TABLE IF NOT EXISTS public.daily_production (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                 DATE NOT NULL DEFAULT CURRENT_DATE,
  raw_kg_used          NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (raw_kg_used >= 0),
  finished_kg_produced NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (finished_kg_produced >= 0),
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- 6. Закупки неготового сырья
CREATE TABLE IF NOT EXISTS public.raw_material_purchases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_kg  NUMERIC(12,3) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cost   NUMERIC(14,2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
  supplier     TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 7. Индексы
CREATE INDEX IF NOT EXISTS idx_income_user_date             ON public.income(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date           ON public.expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_expenses_user_date  ON public.personal_expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id             ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_production_user_date   ON public.daily_production(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_raw_purchases_user_date      ON public.raw_material_purchases(user_id, date DESC);

-- 8. РАЗДАЧА ПРАВ ДОСТУПА НА ТАБЛИЦЫ (ГЛАВНЫЙ ФИКС "Permission Denied")
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 9. Row Level Security (RLS)
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_production   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_purchases ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Income
CREATE POLICY "income_select" ON public.income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "income_insert" ON public.income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_update" ON public.income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "income_delete" ON public.income FOR DELETE USING (auth.uid() = user_id);

-- Expenses
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Personal Expenses
CREATE POLICY "personal_select" ON public.personal_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "personal_insert" ON public.personal_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personal_update" ON public.personal_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "personal_delete" ON public.personal_expenses FOR DELETE USING (auth.uid() = user_id);

-- Daily Production
CREATE POLICY "dp_select" ON public.daily_production FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dp_insert" ON public.daily_production FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dp_update" ON public.daily_production FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dp_delete" ON public.daily_production FOR DELETE USING (auth.uid() = user_id);

-- Raw Material Purchases
CREATE POLICY "rmp_select" ON public.raw_material_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rmp_insert" ON public.raw_material_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rmp_update" ON public.raw_material_purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rmp_delete" ON public.raw_material_purchases FOR DELETE USING (auth.uid() = user_id);

-- 10. Триггер профиля и VIEW склада
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, business_name, raw_purchase_price_per_kg, yield_percent, selling_price_per_kg, desired_profit, daily_capacity_kg, initial_raw_kg, initial_finished_kg
  )
  VALUES (NEW.id, NULL, 0, 0, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE VIEW public.warehouse_balance AS
SELECT
  p.user_id,
  COALESCE(p.initial_raw_kg, 0) + COALESCE((SELECT SUM(rmp.quantity_kg) FROM public.raw_material_purchases rmp WHERE rmp.user_id = p.user_id), 0) - COALESCE((SELECT SUM(dp.raw_kg_used) FROM public.daily_production dp WHERE dp.user_id = p.user_id), 0) AS raw_kg_balance,
  COALESCE(p.initial_finished_kg, 0) + COALESCE((SELECT SUM(dp.finished_kg_produced) FROM public.daily_production dp WHERE dp.user_id = p.user_id), 0) - COALESCE((SELECT SUM(i.quantity_kg) FROM public.income i WHERE i.user_id = p.user_id), 0) AS finished_kg_balance
FROM public.profiles p;

GRANT SELECT ON public.warehouse_balance TO authenticated;

-- ВОССТАНОВЛЕНИЕ ПРОФИЛЕЙ ДЛЯ СТАРЫХ ПОЛЬЗОВАТЕЛЕЙ
INSERT INTO public.profiles (user_id, business_name, raw_purchase_price_per_kg, yield_percent, selling_price_per_kg, desired_profit, daily_capacity_kg, initial_raw_kg, initial_finished_kg)
SELECT id, NULL, 0, 0, 0, 0, 0, 0, 0
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.user_id = auth.users.id);
