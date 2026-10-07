import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { useLayout } from '../lib/layout'
import { useDerived } from '../state/store'
import { RewardsChip } from './RewardsBar'
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
              `flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${isActive ? 'text-ink' : 'text-ink-3 hover:text-ink'}`
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
  const { web } = useLayout()
  if (web) {
    return (
      <>
        <TopNav />
        <main key={pathname} className="flex-1 overflow-y-auto animate-fade">
          <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-10 pt-8 pb-12"><Outlet /></div>
          <WebFooter />
        </main>
      </>
    )
  }
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
  const { web } = useLayout()
  if (web) {
    // Onboarding is its own split-screen; everything else gets the nav + container.
    if (pathname === '/welcome') return <main className="flex-1 overflow-y-auto flex flex-col animate-fade"><Outlet /></main>
    return (
      <>
        <TopNav />
        <main key={pathname} className="flex-1 overflow-y-auto flex flex-col animate-fade">
          <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-10 pt-6 pb-12 flex-1 flex flex-col"><Outlet /></div>
        </main>
      </>
    )
  }
  return (
    <main key={pathname} className="flex-1 overflow-y-auto no-scrollbar flex flex-col animate-fade">
      <Outlet />
    </main>
  )
}

const DEMO_STEPS = [
  'Pick 🎮 PS5 in onboarding',
  'Planner: drag "What if I save…", lock Save + Invest',
  "Home: see where your ₹35,000 goes, then Make this month's move",
  'Turn on Autopilot, then Skip to next month',
  'Agent: "I have ₹5,000 left" → a split that follows your plan',
  'Agent: "Can I afford an iPhone?" → Buy, Build or Wait',
  'Invest → FOMO Shield on VoltEdge, MoonPaw and SteadyGold',
  'Money → your score moved, one priority',
]

/** Phone frame on desktop with a short guide beside it; full-bleed on mobile. */
function PhoneShell({ children }: { children: ReactNode }) {
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
        <div className="mt-8 label">4-minute demo path</div>
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

/* ------------------------------ Web (windows) ------------------------------ */

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="rounded-full bg-mint grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l5-5 4 4 6-7" /></svg>
      </span>
      <span className="font-display font-semibold text-[19px] tracking-tight">Groww Dreams</span>
    </span>
  )
}

/** Sticky top bar: logo, tabs with underline, search-style agent entry, streak/XP, profile. */
function TopNav() {
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const [guide, setGuide] = useState(false)

  // "/" or Ctrl/Cmd+K jumps to the agent, like a search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA)$/.test(t.tagName)) return
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); nav('/agent') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nav])

  return (
    <header className="relative z-30 shrink-0 bg-paper-card/90 backdrop-blur border-b border-paper-line">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10 h-16 flex items-center gap-6 lg:gap-8">
        <NavLink to="/home" aria-label="Home" className="shrink-0 whitespace-nowrap"><Logo /></NavLink>

        <nav className="flex shrink-0 items-stretch h-full gap-1">
          {TABS.map(({ to, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `relative px-3.5 flex items-center text-[15px] font-semibold transition ${isActive ? 'text-ink' : 'text-ink-3 hover:text-ink'}`
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && <span className="absolute left-3 right-3 -bottom-px h-[3px] rounded-t-full bg-mint" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => nav('/agent')}
          className="hidden md:flex ml-auto flex-1 min-w-0 max-w-[360px] items-center gap-2.5 h-10 rounded-xl bg-paper border border-paper-line px-3.5 text-left text-[14px] text-ink-3 hover:border-ink/20 hover:bg-white transition"
        >
          <SparkIcon width={17} height={17} className="text-mint" />
          <span className="flex-1 truncate">Search or ask Groww Dreams…</span>
          <kbd className="text-[11px] font-medium text-ink-3">Ctrl+K</kbd>
        </button>

        <div className="ml-auto md:ml-0 flex shrink-0 items-center gap-2 whitespace-nowrap">
          <RewardsChip className="hidden sm:inline-flex" />
          <div className="relative">
            <button
              onClick={() => setGuide((g) => !g)}
              className="h-9 px-3 rounded-lg text-[13px] font-semibold text-ink-2 hover:bg-ink/5 transition"
              aria-expanded={guide}
            >
              Demo guide
            </button>
            {guide && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setGuide(false)} />
                <div className="absolute right-0 top-11 z-40 w-[320px] card p-5 shadow-lift animate-fade">
                  <div className="label">4-minute demo path</div>
                  <ol className="mt-3 space-y-2.5">
                    {DEMO_STEPS.map((s, i) => (
                      <li key={s} className="flex gap-3 text-sm text-ink-2">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-ink text-white text-[11px] font-bold grid place-items-center">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <button
                    onClick={() => { setGuide(false); dispatch({ type: 'RESET' }); nav('/welcome') }}
                    className="mt-4 text-sm font-semibold text-ink-3 underline underline-offset-4 hover:text-ink"
                  >
                    Restart demo
                  </button>
                </div>
              </>
            )}
          </div>
          <span className="w-9 h-9 rounded-full bg-mint-soft text-mint-dark font-display font-bold grid place-items-center" title={state.user.name}>
            {state.user.name.trim().charAt(0).toUpperCase() || '·'}
          </span>
        </div>
      </div>
      <GoalTicker />
    </header>
  )
}

function WebFooter() {
  return (
    <footer className="border-t border-paper-line">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10 py-6 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <Logo size={24} />
        <p className="text-[11.5px] text-ink-3 leading-relaxed max-w-[640px]">
          Product concept. All data is mock and stored only in this browser. Not affiliated with or endorsed by Groww. Not investment advice.
        </p>
      </div>
    </footer>
  )
}

function WebShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[100dvh] w-full flex flex-col bg-paper overflow-hidden">
      {children}
      <div id="sheet-root" />
      <Toast />
    </div>
  )
}

/** Picks the phone frame or the full web shell from `?type=`. */
export function Shell({ children }: { children: ReactNode }) {
  const { web } = useLayout()
  return web ? <WebShell>{children}</WebShell> : <PhoneShell>{children}</PhoneShell>
}

/** Groww's web header has a live market ticker. This is the Dreams version: your own numbers, same glanceable slot. */
function GoalTicker() {
  const { state } = useApp()
  const { goal, health, user } = useDerived()
  const nav = useNavigate()
  const delta = state.startHealth !== null ? health.total - state.startHealth : 0
  const pct = goal ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0
  const items = [
    goal && { k: goal.name.toUpperCase(), v: `${pct}%`, tone: 'text-mint-dark', arrow: '▲', to: `/goals/${goal.id}` },
    { k: 'MONEY HEALTH', v: String(health.total), tone: delta >= 0 ? 'text-mint-dark' : 'text-coral', arrow: delta === 0 ? '' : delta > 0 ? `▲ ${delta}` : `▼ ${-delta}`, to: '/money' },
    { k: 'STREAK', v: `${state.streak}d`, tone: 'text-ink-2', arrow: '', to: '/money' },
    { k: 'FREE EACH MONTH', v: `₹${user.monthlyAvailable.toLocaleString('en-IN')}`, tone: 'text-ink-2', arrow: '', to: '/home' },
  ].filter(Boolean) as { k: string; v: string; tone: string; arrow: string; to: string }[]
  return (
    <div className="hidden md:block border-t border-paper-line bg-paper">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10 h-9 flex items-center gap-7 overflow-x-auto no-scrollbar text-[12px] whitespace-nowrap">
        {items.map((i) => (
          <button key={i.k} onClick={() => nav(i.to)} className="flex items-center gap-2 hover:opacity-70 transition">
            <span className="font-semibold text-ink-3 tracking-wide">{i.k}</span>
            <span className={`num font-semibold ${i.tone}`}>{i.v}</span>
            {i.arrow && <span className={`num font-semibold ${i.tone}`}>{i.arrow}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
