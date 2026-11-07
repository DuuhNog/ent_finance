import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { AppLayout } from './components/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'

const SummaryPage = lazy(() =>
  import('./features/summary/SummaryPage').then((module) => ({
    default: module.SummaryPage,
  })),
)
const TransactionsPage = lazy(() =>
  import('./features/transactions/TransactionsPage').then((module) => ({
    default: module.TransactionsPage,
  })),
)
const RecurringBillsPage = lazy(() =>
  import('./features/recurringBills/RecurringBillsPage').then((module) => ({
    default: module.RecurringBillsPage,
  })),
)
const GoalsPage = lazy(() =>
  import('./features/goals/GoalsPage').then((module) => ({
    default: module.GoalsPage,
  })),
)
const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)
const TrashPage = lazy(() =>
  import('./features/transactions/TrashPage').then((module) => ({
    default: module.TrashPage,
  })),
)

function PageFallback() {
  return <p className="p-4 text-slate-600">Carregando...</p>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageFallback />}>
                  <SummaryPage />
                </Suspense>
              }
            />
            <Route
              path="/lancamentos"
              element={
                <Suspense fallback={<PageFallback />}>
                  <TransactionsPage />
                </Suspense>
              }
            />
            <Route
              path="/contas"
              element={
                <Suspense fallback={<PageFallback />}>
                  <RecurringBillsPage />
                </Suspense>
              }
            />
            <Route
              path="/metas"
              element={
                <Suspense fallback={<PageFallback />}>
                  <GoalsPage />
                </Suspense>
              }
            />
            <Route
              path="/ajustes"
              element={
                <Suspense fallback={<PageFallback />}>
                  <SettingsPage />
                </Suspense>
              }
            />
            <Route
              path="/lixeira"
              element={
                <Suspense fallback={<PageFallback />}>
                  <TrashPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
