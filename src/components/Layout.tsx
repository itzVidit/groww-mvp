import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { GoalIcon, HomeIcon, InvestIcon, MoneyIcon, SparkIcon } from './Icons'
import { Toast } from './Toast'

const TABS = [
  { to: '/home', label: 'Home', Icon: HomeIcon },
  { to: '/goals', label: 'Goals', Icon: GoalIcon },
  { to: '/invest', label: 'Invest', Icon: InvestIcon },
  { to: '/money', label: 'Money', Icon: MoneyIcon },
]

export function BottomNavigation() {
  return (
    <nav className="relative z-30 bg-paper-card border-t border-paper-line pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-[64px]">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${isActive ? 'text-ink' : 'text-ink-4 hover:text-ink-3'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon width={22} height={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function AgentFab() {
  const nav = useNavigate()
  return (
    <button
      onClick={() => nav('/agent')}
      className="absolute right-4 bottom-[84px] z-30 flex items-center gap-2 rounded-full bg-ink text-white pl-3.5 pr-4 h-12 shadow-lift hover:bg-ink-2 transition active:scale-95"
      aria-label="Open Money Agent"
    >
      <SparkIcon width={20} height={20} className="text-mint" />
      <span className="text-sm font-semibold">Ask Agent</span>
    </button>
  )
}

/** Main tabbed area: scrolling content + floating agent + bottom nav. */
export function TabLayout() {
  const { pathname } = useLocation()
  return (
    <>
      <main key={pathname} className="flex-1 overflow-y-auto no-scrollbar animate-fade">
        <Outlet />
        <div className="h-20" />
      </main>
      <AgentFab />
      <BottomNavigation />
    </>
  )
}

/** Full-screen pages (planner, agent) without the tab bar. */
export function FullLayout() {
  const { pathname } = useLocation()
  return (
    <main key={pathname} className="flex-1 overflow-y-auto no-scrollbar flex flex-col animate-fade">
      <Outlet />
    </main>
  )
}

const DEMO_STEPS = [
  'Pick 🎮 PS5 in onboarding',
  'Choose a plan & lock it',
  "Home → Make this month's move",
  'Ask Agent: "I have ₹5,000 left"',
  'Invest → 🔥 Trending → FOMO Check',
  'Money → see your one priority',
]

/** Phone frame on desktop with a short guide beside it; full-bleed on mobile. */
export function Shell({ children }: { children: ReactNode }) {
  const { dispatch } = useApp()
  const nav = useNavigate()
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center lg:gap-16 md:py-6">
      <aside className="hidden lg:block w-[300px] shrink-0">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-full bg-mint grid place-items-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l5-5 4 4 6-7" /></svg>
          </div>
          <div className="font-display font-semibold text-lg">Groww Dreams</div>
        </div>
        <h1 className="font-display text-[34px] leading-[1.05] font-semibold tracking-tight">
          Turn what you want today into wealth for tomorrow.
        </h1>
        <p className="mt-4 text-ink-2 text-[15px] leading-relaxed">
          A Gen-Z concept for Groww: start from the thing you want, then see exactly what your money needs to do.
        </p>
        <div className="mt-8 label">3-minute demo path</div>
        <ol className="mt-3 space-y-2.5">
          {DEMO_STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm text-ink-2">
              <span className="w-5 h-5 shrink-0 rounded-full bg-ink text-white text-[11px] font-bold grid place-items-center">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <button
          onClick={() => { dispatch({ type: 'RESET' }); nav('/welcome') }}
          className="mt-8 text-sm font-semibold text-ink-3 underline underline-offset-4 hover:text-ink"
        >
          Restart demo
        </button>
        <p className="mt-6 text-[11px] text-ink-3 leading-relaxed">
          Product concept. All data is mock and stored only in this browser. Not affiliated with or endorsed by Groww. Not investment advice.
        </p>
      </aside>
      <div className="relative flex flex-col bg-paper overflow-hidden w-full h-[100dvh] md:w-[400px] md:h-[min(860px,calc(100dvh-48px))] md:rounded-[40px] md:shadow-lift md:border md:border-black/5">
        {children}
        <div id="sheet-root" />
        <Toast />
      </div>
    </div>
  )
}
