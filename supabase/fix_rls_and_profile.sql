-- 1. Создаем профили для существующих пользователей (если они пропали при очистке базы)
INSERT INTO public.profiles (
  user_id, business_name, 
  raw_purchase_price_per_kg, yield_percent, selling_price_per_kg, desired_profit, 
  daily_capacity_kg, initial_raw_kg, initial_finished_kg
)
SELECT id, NULL, 0, 0, 0, 0, 0, 0, 0
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE public.profiles.user_id = auth.users.id
);

-- 2. Пересоздаем строгие и понятные правила RLS для всех таблиц
-- PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- DAILY PRODUCTION (Журнал производства)
DROP POLICY IF EXISTS "dp_all" ON public.daily_production;
DROP POLICY IF EXISTS "dp_select" ON public.daily_production;
DROP POLICY IF EXISTS "dp_insert" ON public.daily_production;
DROP POLICY IF EXISTS "dp_update" ON public.daily_production;
DROP POLICY IF EXISTS "dp_delete" ON public.daily_production;
CREATE POLICY "dp_select" ON public.daily_production FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dp_insert" ON public.daily_production FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dp_update" ON public.daily_production FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dp_delete" ON public.daily_production FOR DELETE USING (auth.uid() = user_id);

-- RAW MATERIAL PURCHASES (Закупки сырья)
DROP POLICY IF EXISTS "rmp_all" ON public.raw_material_purchases;
DROP POLICY IF EXISTS "rmp_select" ON public.raw_material_purchases;
DROP POLICY IF EXISTS "rmp_insert" ON public.raw_material_purchases;
DROP POLICY IF EXISTS "rmp_update" ON public.raw_material_purchases;
DROP POLICY IF EXISTS "rmp_delete" ON public.raw_material_purchases;
CREATE POLICY "rmp_select" ON public.raw_material_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rmp_insert" ON public.raw_material_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rmp_update" ON public.raw_material_purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rmp_delete" ON public.raw_material_purchases FOR DELETE USING (auth.uid() = user_id);

-- INCOME (Доходы)
DROP POLICY IF EXISTS "income_all" ON public.income;
DROP POLICY IF EXISTS "income_select" ON public.income;
DROP POLICY IF EXISTS "income_insert" ON public.income;
DROP POLICY IF EXISTS "income_update" ON public.income;
DROP POLICY IF EXISTS "income_delete" ON public.income;
CREATE POLICY "income_select" ON public.income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "income_insert" ON public.income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_update" ON public.income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "income_delete" ON public.income FOR DELETE USING (auth.uid() = user_id);

-- EXPENSES (Расходы)
DROP POLICY IF EXISTS "expenses_all" ON public.expenses;
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- PERSONAL EXPENSES (Личные расходы)
DROP POLICY IF EXISTS "personal_all" ON public.personal_expenses;
DROP POLICY IF EXISTS "personal_select" ON public.personal_expenses;
DROP POLICY IF EXISTS "personal_insert" ON public.personal_expenses;
DROP POLICY IF EXISTS "personal_update" ON public.personal_expenses;
DROP POLICY IF EXISTS "personal_delete" ON public.personal_expenses;
CREATE POLICY "personal_select" ON public.personal_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "personal_insert" ON public.personal_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personal_update" ON public.personal_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "personal_delete" ON public.personal_expenses FOR DELETE USING (auth.uid() = user_id);
