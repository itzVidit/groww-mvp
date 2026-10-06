import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppProvider, useApp } from './state/store'
import { LayoutProvider } from './lib/layout'
import { HostProvider, type HostAdapter } from './integration/host'
import { FullLayout, Shell, TabLayout } from './components/Layout'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Goals from './pages/Goals'
import GoalPlanner from './pages/GoalPlanner'
import Invest from './pages/Invest'
import Money from './pages/Money'
import Agent from './pages/Agent'
import { ErrorBoundary } from './components/ErrorBoundary'

function RequireOnboarding({ children }: { children: ReactNode }) {
  const { state } = useApp()
  return state.onboarded ? <>{children}</> : <Navigate to="/welcome" replace />
}

/** Mount point for the Groww app: <DreamsApp host={{ trackEvent, openProduct, startSip }} />. */
export function DreamsApp({ host }: { host?: Partial<HostAdapter> }) {
  return (
    <HostProvider host={host}>
    <LayoutProvider>
    <AppProvider>
      <HashRouter>
        <Shell>
          <ErrorBoundary>
          <Routes>
            <Route element={<FullLayout />}>
              <Route path="/welcome" element={<Onboarding />} />
              <Route path="/goals/:id" element={<RequireOnboarding><GoalPlanner /></RequireOnboarding>} />
              <Route path="/agent" element={<RequireOnboarding><Agent /></RequireOnboarding>} />
            </Route>
            <Route element={<RequireOnboarding><TabLayout /></RequireOnboarding>}>
              <Route path="/home" element={<Home />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/invest" element={<Invest />} />
              <Route path="/money" element={<Money />} />
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          </ErrorBoundary>
        </Shell>
      </HashRouter>
    </AppProvider>
    </LayoutProvider>
    </HostProvider>
  )
}

export default function App() {
  return <DreamsApp />
}
