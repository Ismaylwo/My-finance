-- ============================================================================
-- BUSINESS CONTROL — ПОЛНАЯ УСТАНОВКА SUPABASE
-- Один вид сырья + один вид готовой продукции
--
-- Использование:
--   1. Создайте НОВЫЙ проект Supabase.
--   2. Откройте SQL Editor -> New query.
--   3. Вставьте этот файл целиком и нажмите Run ОДИН РАЗ.
--
-- Файл предназначен только для новой пустой базы и выполняется один раз.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. ТАБЛИЦЫ
-- --------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name                TEXT,
  raw_purchase_price_per_kg    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (raw_purchase_price_per_kg >= 0),
  yield_percent                NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (yield_percent >= 0 AND yield_percent <= 100),
  selling_price_per_kg         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (selling_price_per_kg >= 0),
  desired_profit               NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (desired_profit >= 0),
  daily_capacity_kg            NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (daily_capacity_kg >= 0),
  initial_raw_kg               NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (initial_raw_kg >= 0),
  initial_finished_kg          NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (initial_finished_kg >= 0),
  initial_raw_cost_per_kg      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (initial_raw_cost_per_kg >= 0),
  initial_finished_cost_per_kg NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (initial_finished_cost_per_kg >= 0),
  variable_cost_per_kg         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (variable_cost_per_kg >= 0),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.income (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_kg  NUMERIC(12,3) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg NUMERIC(12,2) NOT NULL CHECK (price_per_kg > 0),
  total_amount NUMERIC(14,2) GENERATED ALWAYS AS (ROUND(quantity_kg * price_per_kg, 2)) STORED,
  description  TEXT,
  is_paid      BOOLEAN NOT NULL DEFAULT false,
  client_name  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  category     TEXT NOT NULL,
  expense_type TEXT NOT NULL DEFAULT 'fixed'
    CHECK (expense_type IN ('fixed', 'production_variable', 'selling_variable')),
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.personal_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  amount      NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.daily_production (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                 DATE NOT NULL DEFAULT CURRENT_DATE,
  raw_kg_used          NUMERIC(12,3) NOT NULL CHECK (raw_kg_used > 0),
  finished_kg_produced NUMERIC(12,3) NOT NULL CHECK (finished_kg_produced > 0),
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.raw_material_purchases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_kg  NUMERIC(12,3) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg NUMERIC(12,2) NOT NULL CHECK (price_per_kg > 0),
  total_cost   NUMERIC(14,2) GENERATED ALWAYS AS (ROUND(quantity_kg * price_per_kg, 2)) STORED,
  supplier     TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.income_payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_id  UUID NOT NULL REFERENCES public.income(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  amount     NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 2. ИНДЕКСЫ
-- --------------------------------------------------------------------------

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_income_user_date ON public.income(user_id, date DESC);
CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date DESC);
CREATE INDEX idx_personal_expenses_user_date ON public.personal_expenses(user_id, date DESC);
CREATE INDEX idx_daily_production_user_date ON public.daily_production(user_id, date DESC);
CREATE INDEX idx_raw_purchases_user_date ON public.raw_material_purchases(user_id, date DESC);
CREATE INDEX idx_income_payments_user_date ON public.income_payments(user_id, date DESC);
CREATE INDEX idx_income_payments_income ON public.income_payments(income_id);

-- --------------------------------------------------------------------------
-- 3. ПРАВА И ROW LEVEL SECURITY
-- Каждый пользователь видит и изменяет только свои записи.
-- --------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO authenticated;

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.income FROM anon;
REVOKE ALL ON public.expenses FROM anon;
REVOKE ALL ON public.personal_expenses FROM anon;
REVOKE ALL ON public.daily_production FROM anon;
REVOKE ALL ON public.raw_material_purchases FROM anon;
REVOKE ALL ON public.income_payments FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_production TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.raw_material_purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_payments TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY income_select ON public.income
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY income_insert ON public.income
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY income_update ON public.income
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY income_delete ON public.income
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY expenses_select ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY expenses_insert ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY expenses_update ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY expenses_delete ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY personal_expenses_select ON public.personal_expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY personal_expenses_insert ON public.personal_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY personal_expenses_update ON public.personal_expenses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY personal_expenses_delete ON public.personal_expenses
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY daily_production_select ON public.daily_production
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY daily_production_insert ON public.daily_production
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY daily_production_update ON public.daily_production
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY daily_production_delete ON public.daily_production
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY raw_purchases_select ON public.raw_material_purchases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY raw_purchases_insert ON public.raw_material_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY raw_purchases_update ON public.raw_material_purchases
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY raw_purchases_delete ON public.raw_material_purchases
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY income_payments_select ON public.income_payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY income_payments_insert ON public.income_payments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.income i
      WHERE i.id = income_id AND i.user_id = auth.uid()
    )
  );
CREATE POLICY income_payments_update ON public.income_payments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.income i
      WHERE i.id = income_id AND i.user_id = auth.uid()
    )
  );
CREATE POLICY income_payments_delete ON public.income_payments
  FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- 4. АВТОМАТИЧЕСКИЙ ПРОФИЛЬ ПОСЛЕ РЕГИСТРАЦИИ
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Если в новом проекте пользователь был создан до выполнения этого файла.
INSERT INTO public.profiles (user_id)
SELECT u.id
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- --------------------------------------------------------------------------
-- 5. UPDATED_AT
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER daily_production_set_updated_at
  BEFORE UPDATE ON public.daily_production
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 6. ОПЛАТЫ: ПРОВЕРКА СУММЫ И СИНХРОНИЗАЦИЯ СТАТУСА ПРОДАЖИ
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_income_payment()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total NUMERIC(14,2);
  invoice_user UUID;
  invoice_date DATE;
  already_paid NUMERIC(14,2);
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.income_id::text));

  SELECT total_amount, user_id, date
    INTO invoice_total, invoice_user, invoice_date
  FROM public.income
  WHERE id = NEW.income_id;

  IF invoice_total IS NULL THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;
  IF invoice_user <> NEW.user_id THEN
    RAISE EXCEPTION 'Payment owner does not match sale owner';
  END IF;
  IF NEW.date < invoice_date THEN
    RAISE EXCEPTION 'Payment date cannot be earlier than sale date';
  END IF;

  SELECT COALESCE(SUM(amount), 0)
    INTO already_paid
  FROM public.income_payments
  WHERE income_id = NEW.income_id
    AND (TG_OP <> 'UPDATE' OR id <> NEW.id);

  IF already_paid + NEW.amount > invoice_total + 0.005 THEN
    RAISE EXCEPTION 'Payment exceeds outstanding balance';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE ALL ON FUNCTION public.validate_income_payment() FROM PUBLIC;

CREATE TRIGGER validate_income_payment_trigger
  BEFORE INSERT OR UPDATE ON public.income_payments
  FOR EACH ROW EXECUTE FUNCTION public.validate_income_payment();

CREATE OR REPLACE FUNCTION public.sync_income_paid_status()
RETURNS TRIGGER AS $$
DECLARE
  target_income UUID;
BEGIN
  target_income := CASE WHEN TG_OP = 'DELETE' THEN OLD.income_id ELSE NEW.income_id END;

  IF TG_OP = 'UPDATE' AND OLD.income_id IS DISTINCT FROM NEW.income_id THEN
    UPDATE public.income i
    SET is_paid = COALESCE((
      SELECT SUM(p.amount) >= i.total_amount - 0.005
      FROM public.income_payments p
      WHERE p.income_id = i.id
    ), false)
    WHERE i.id = OLD.income_id;
  END IF;

  UPDATE public.income i
  SET is_paid = COALESCE((
    SELECT SUM(p.amount) >= i.total_amount - 0.005
    FROM public.income_payments p
    WHERE p.income_id = i.id
  ), false)
  WHERE i.id = target_income;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE ALL ON FUNCTION public.sync_income_paid_status() FROM PUBLIC;

CREATE TRIGGER sync_income_paid_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.income_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_income_paid_status();

-- --------------------------------------------------------------------------
-- 7. ПРОВЕРКА СКЛАДА ПЕРЕД ПРОИЗВОДСТВОМ И ПРОДАЖЕЙ
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_production_inventory()
RETURNS TRIGGER AS $$
DECLARE
  available_raw NUMERIC;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));

  SELECT
    COALESCE(p.initial_raw_kg, 0)
    + COALESCE((
      SELECT SUM(r.quantity_kg)
      FROM public.raw_material_purchases r
      WHERE r.user_id = NEW.user_id AND r.date <= NEW.date
    ), 0)
    - COALESCE((
      SELECT SUM(d.raw_kg_used)
      FROM public.daily_production d
      WHERE d.user_id = NEW.user_id
        AND d.date <= NEW.date
        AND (TG_OP <> 'UPDATE' OR d.id <> NEW.id)
    ), 0)
  INTO available_raw
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  IF available_raw IS NULL THEN
    RAISE EXCEPTION 'Business profile not found';
  END IF;
  IF NEW.raw_kg_used > available_raw + 0.0005 THEN
    RAISE EXCEPTION 'Insufficient raw inventory on production date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE ALL ON FUNCTION public.validate_production_inventory() FROM PUBLIC;

CREATE TRIGGER validate_production_inventory_trigger
  BEFORE INSERT OR UPDATE OF user_id, date, raw_kg_used, finished_kg_produced
  ON public.daily_production
  FOR EACH ROW EXECUTE FUNCTION public.validate_production_inventory();

CREATE OR REPLACE FUNCTION public.validate_sale_inventory()
RETURNS TRIGGER AS $$
DECLARE
  available_finished NUMERIC;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));

  SELECT
    COALESCE(p.initial_finished_kg, 0)
    + COALESCE((
      SELECT SUM(d.finished_kg_produced)
      FROM public.daily_production d
      WHERE d.user_id = NEW.user_id AND d.date <= NEW.date
    ), 0)
    - COALESCE((
      SELECT SUM(i.quantity_kg)
      FROM public.income i
      WHERE i.user_id = NEW.user_id
        AND i.date <= NEW.date
        AND (TG_OP <> 'UPDATE' OR i.id <> NEW.id)
    ), 0)
  INTO available_finished
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  IF available_finished IS NULL THEN
    RAISE EXCEPTION 'Business profile not found';
  END IF;
  IF NEW.quantity_kg > available_finished + 0.0005 THEN
    RAISE EXCEPTION 'Insufficient finished inventory on sale date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE ALL ON FUNCTION public.validate_sale_inventory() FROM PUBLIC;

CREATE TRIGGER validate_sale_inventory_trigger
  BEFORE INSERT OR UPDATE OF user_id, date, quantity_kg
  ON public.income
  FOR EACH ROW EXECUTE FUNCTION public.validate_sale_inventory();

-- Проверяет всю историю после изменения старых операций. Нельзя удалить или
-- перенести запись так, чтобы остаток стал отрицательным в прошлом.
CREATE OR REPLACE FUNCTION public.assert_inventory_history_valid()
RETURNS TRIGGER AS $$
DECLARE
  uid UUID;
  opening_raw NUMERIC;
  opening_finished NUMERIC;
  minimum_raw NUMERIC;
  minimum_finished NUMERIC;
BEGIN
  uid := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));

  SELECT COALESCE(initial_raw_kg, 0), COALESCE(initial_finished_kg, 0)
    INTO opening_raw, opening_finished
  FROM public.profiles
  WHERE user_id = uid;

  IF opening_raw IS NULL THEN
    RAISE EXCEPTION 'Business profile not found';
  END IF;

  WITH raw_days AS (
    SELECT date, SUM(purchased) AS purchased, SUM(consumed) AS consumed
    FROM (
      SELECT date, quantity_kg AS purchased, 0::NUMERIC AS consumed
      FROM public.raw_material_purchases WHERE user_id = uid
      UNION ALL
      SELECT date, 0::NUMERIC, raw_kg_used
      FROM public.daily_production WHERE user_id = uid
    ) movements
    GROUP BY date
  ), raw_running AS (
    SELECT opening_raw + SUM(purchased - consumed) OVER (ORDER BY date) AS balance
    FROM raw_days
  )
  SELECT COALESCE(MIN(balance), opening_raw) INTO minimum_raw FROM raw_running;

  WITH finished_days AS (
    SELECT date, SUM(produced) AS produced, SUM(sold) AS sold
    FROM (
      SELECT date, finished_kg_produced AS produced, 0::NUMERIC AS sold
      FROM public.daily_production WHERE user_id = uid
      UNION ALL
      SELECT date, 0::NUMERIC, quantity_kg
      FROM public.income WHERE user_id = uid
    ) movements
    GROUP BY date
  ), finished_running AS (
    SELECT opening_finished + SUM(produced - sold) OVER (ORDER BY date) AS balance
    FROM finished_days
  )
  SELECT COALESCE(MIN(balance), opening_finished)
    INTO minimum_finished FROM finished_running;

  IF minimum_raw < -0.0005 THEN
    RAISE EXCEPTION 'Operation creates negative raw inventory in history';
  END IF;
  IF minimum_finished < -0.0005 THEN
    RAISE EXCEPTION 'Operation creates negative finished inventory in history';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE ALL ON FUNCTION public.assert_inventory_history_valid() FROM PUBLIC;

CREATE TRIGGER assert_inventory_after_purchase_insert_delete
  AFTER INSERT OR DELETE ON public.raw_material_purchases
  FOR EACH ROW EXECUTE FUNCTION public.assert_inventory_history_valid();
CREATE TRIGGER assert_inventory_after_purchase_update
  AFTER UPDATE OF user_id, date, quantity_kg ON public.raw_material_purchases
  FOR EACH ROW EXECUTE FUNCTION public.assert_inventory_history_valid();

CREATE TRIGGER assert_inventory_after_production_insert_delete
  AFTER INSERT OR DELETE ON public.daily_production
  FOR EACH ROW EXECUTE FUNCTION public.assert_inventory_history_valid();
CREATE TRIGGER assert_inventory_after_production_update
  AFTER UPDATE OF user_id, date, raw_kg_used, finished_kg_produced ON public.daily_production
  FOR EACH ROW EXECUTE FUNCTION public.assert_inventory_history_valid();

CREATE TRIGGER assert_inventory_after_sale_insert_delete
  AFTER INSERT OR DELETE ON public.income
  FOR EACH ROW EXECUTE FUNCTION public.assert_inventory_history_valid();
CREATE TRIGGER assert_inventory_after_sale_update
  AFTER UPDATE OF user_id, date, quantity_kg ON public.income
  FOR EACH ROW EXECUTE FUNCTION public.assert_inventory_history_valid();

CREATE TRIGGER assert_inventory_after_opening_balance
  AFTER UPDATE OF initial_raw_kg, initial_finished_kg ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assert_inventory_history_valid();

-- --------------------------------------------------------------------------
-- 8. АТОМАРНОЕ СОЗДАНИЕ ПРОДАЖИ С ПЕРВОЙ ОПЛАТОЙ
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_sale(
  p_date DATE,
  p_quantity_kg NUMERIC,
  p_price_per_kg NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_client_name TEXT DEFAULT NULL,
  p_initial_payment NUMERIC DEFAULT 0
)
RETURNS public.income AS $$
DECLARE
  uid UUID := auth.uid();
  invoice_total NUMERIC;
  created_sale public.income;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_date IS NULL THEN RAISE EXCEPTION 'Sale date is required'; END IF;
  IF p_quantity_kg <= 0 OR p_price_per_kg <= 0 THEN
    RAISE EXCEPTION 'Quantity and price must be positive';
  END IF;

  invoice_total := ROUND(p_quantity_kg * p_price_per_kg, 2);
  IF p_initial_payment < 0 OR p_initial_payment > invoice_total + 0.005 THEN
    RAISE EXCEPTION 'Invalid initial payment';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(uid::text));

  INSERT INTO public.income (
    user_id, date, quantity_kg, price_per_kg, description, client_name, is_paid
  ) VALUES (
    uid, p_date, p_quantity_kg, p_price_per_kg, p_description, p_client_name, false
  ) RETURNING * INTO created_sale;

  IF p_initial_payment > 0 THEN
    INSERT INTO public.income_payments (user_id, income_id, date, amount, notes)
    VALUES (uid, created_sale.id, p_date, p_initial_payment, 'Первоначальная оплата');
  END IF;

  SELECT * INTO created_sale FROM public.income WHERE id = created_sale.id;
  RETURN created_sale;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

REVOKE ALL ON FUNCTION public.record_sale(DATE, NUMERIC, NUMERIC, TEXT, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_sale(DATE, NUMERIC, NUMERIC, TEXT, TEXT, NUMERIC) TO authenticated;

-- --------------------------------------------------------------------------
-- 9. АТОМАРНАЯ ОЧИСТКА ОПЕРАЦИЙ ИЗ «ОПАСНОЙ ЗОНЫ»
-- Профиль, цены и начальные остатки сохраняются.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reset_business_data()
RETURNS VOID AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));

  DELETE FROM public.income_payments WHERE user_id = uid;
  DELETE FROM public.income WHERE user_id = uid;
  DELETE FROM public.daily_production WHERE user_id = uid;
  DELETE FROM public.raw_material_purchases WHERE user_id = uid;
  DELETE FROM public.expenses WHERE user_id = uid;
  DELETE FROM public.personal_expenses WHERE user_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

REVOKE ALL ON FUNCTION public.reset_business_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_business_data() TO authenticated;

-- --------------------------------------------------------------------------
-- 10. БЕЗОПАСНОЕ ПРЕДСТАВЛЕНИЕ ТЕКУЩИХ ОСТАТКОВ
-- --------------------------------------------------------------------------

CREATE VIEW public.warehouse_balance
WITH (security_invoker = true) AS
SELECT
  p.user_id,
  COALESCE(p.initial_raw_kg, 0)
    + COALESCE((SELECT SUM(r.quantity_kg) FROM public.raw_material_purchases r WHERE r.user_id = p.user_id), 0)
    - COALESCE((SELECT SUM(d.raw_kg_used) FROM public.daily_production d WHERE d.user_id = p.user_id), 0)
    AS raw_kg_balance,
  COALESCE(p.initial_finished_kg, 0)
    + COALESCE((SELECT SUM(d.finished_kg_produced) FROM public.daily_production d WHERE d.user_id = p.user_id), 0)
    - COALESCE((SELECT SUM(i.quantity_kg) FROM public.income i WHERE i.user_id = p.user_id), 0)
    AS finished_kg_balance
FROM public.profiles p;

GRANT SELECT ON public.warehouse_balance TO authenticated;

COMMIT;

-- После успешного выполнения в результате SQL Editor должно быть: Success.
