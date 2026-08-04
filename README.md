# 💼 Business Dashboard

Система управления бизнесом — учёт доходов, расходов, личных трат и расчёт точки безубыточности.

**Хостинг:** GitHub Pages | **База данных:** Supabase | **Валюта:** TJS (сомони)

---

## 🚀 Быстрый старт

### 1. Создать проект в Supabase

1. Зайди на [supabase.com](https://supabase.com) → **New Project**
2. Дай имя проекту (например, `business-dashboard`)
3. Дождись инициализации (~2 минуты)
4. Перейди: **SQL Editor** → вставь содержимое файла `supabase/schema.sql` → **Run**
5. Перейди: **Settings → API** и скопируй:
   - `Project URL` → это твой `VITE_SUPABASE_URL`
   - `anon public` key → это твой `VITE_SUPABASE_ANON_KEY`

### 2. Настроить локальный запуск

```bash
npm install
```

Отредактируй `.env.local`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```bash
npm run dev
```

Открой: http://localhost:5173/business-dashboard/

---

## 📦 Деплой на GitHub Pages

### 1. Создать репозиторий на GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/business-dashboard.git
git push -u origin main
```

### 2. Добавить секреты в GitHub

**GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

- `VITE_SUPABASE_URL` = твой Supabase URL
- `VITE_SUPABASE_ANON_KEY` = твой anon key

### 3. Включить GitHub Pages

**GitHub repo → Settings → Pages** → Source: **GitHub Actions**

Сайт будет доступен: `https://YOUR_USERNAME.github.io/business-dashboard/`

---

## 🔢 Формула точки безубыточности

```
Маржа на кг  = Цена продажи − Переменные затраты на кг
Точка 0 (кг) = Фиксированные расходы ÷ Маржа на кг
Цель (кг)    = (Фиксированные расходы + Желаемая прибыль) ÷ Маржа на кг
```

---

## 🛠️ Стек

- **Frontend:** Vite 5 + React 18 + TypeScript
- **Стили:** Tailwind CSS v3 (тёмная тема, glassmorphism)
- **БД / Auth:** Supabase (PostgreSQL)
- **Графики:** Recharts
- **Иконки:** Lucide React
- **Деплой:** GitHub Pages + GitHub Actions
