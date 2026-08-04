import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext, useAuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import IncomePage from './pages/Income'
import ExpensesPage from './pages/Expenses'
import PersonalPage from './pages/Personal'
import BreakEvenPage from './pages/BreakEven'
import AnalyticsPage from './pages/Analytics'
import SettingsPage from './pages/Settings'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/"           element={<Dashboard />} />
                <Route path="/income"     element={<IncomePage />} />
                <Route path="/expenses"   element={<ExpensesPage />} />
                <Route path="/personal"   element={<PersonalPage />} />
                <Route path="/breakeven"  element={<BreakEvenPage />} />
                <Route path="/analytics"  element={<AnalyticsPage />} />
                <Route path="/settings"   element={<SettingsPage />} />
                <Route path="*"           element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  const auth = useAuthProvider()

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter basename="/My-Finance">
        <AppRoutes />
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
