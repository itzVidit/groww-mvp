import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Goal } from '../types'
import { inr, pct, thisMonth } from '../lib/format'
import { activePlan, upcomingMoves, type MonthlyMove } from '../lib/plan'
import { useApp, useDerived } from '../state/store'
import { Button, Pill, ProgressBar, Sheet, SplitBar } from './ui'
import { useHost } from '../integration/host'
import { CheckIcon, ChevronIcon } from './Icons'

/* ------------------------------ GoalCard ----------------------------- */
export function GoalCard({ goal, compact = false }: { goal: Goal; compact?: boolean }) {
  const nav = useNavigate()
  const { user } = useDerived()
  const plan = activePlan(goal, user)
  const progress = pct(goal.currentAmount, goal.targetAmount)
  const done = goal.currentAmount >= goal.targetAmount
  return (
    <button onClick={() => nav(`/goals/${goal.id}`)} className="card w-full text-left p-5 hover:shadow-lift transition group">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-paper grid place-items-center text-[26px] shrink-0">{goal.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-display text-[19px] font-semibold truncate">{goal.name}</span>
            <span className="font-display text-lg font-semibold num text-mint-dark">{Math.round(progress)}%</span>
          </div>
          <div className="text-[14px] text-ink-2 num mt-0.5">
            <b className="text-ink">{inr(goal.currentAmount)}</b> <span className="text-ink-3">/ {inr(goal.targetAmount)}</span>
          </div>
        </div>
      </div>
      <ProgressBar value={progress} height={compact ? 6 : 8} className="mt-4" />
      <div className="mt-3 flex items-center justify-between text-[13px]">
        {done ? (
          <Pill tone="mint">Funded 🎉</Pill>
        ) : plan ? (
          <span className="text-ink-3"><b className="text-ink num">{inr(plan.toGoal)}</b>/mo · ready by {plan.date}</span>
        ) : (
          <Pill tone="amber">No plan yet. Tap to plan it</Pill>
        )}
        <ChevronIcon width={18} height={18} className="text-ink-4 group-hover:translate-x-0.5 transition" />
      </div>
    </button>
  )
}

/* -------------------------- MoneyActionCard -------------------------- */
export function moveRows(move: MonthlyMove, goalName: string) {
  return [
    { label: goalName, amount: move.toGoal, color: 'bg-mint', tone: 'goal' as const },
    { label: 'Emergency buffer', amount: move.toBuffer, color: 'bg-amber', tone: 'buffer' as const },
    { label: 'Long-term investing', amount: move.toInvest, color: 'bg-violet', tone: 'invest' as const },
    { label: 'Flexible spending', amount: move.flexible, color: 'bg-ink/20', tone: 'flex' as const },
    { label: 'EMI', amount: move.emi, color: 'bg-coral', tone: 'warn' as const },
  ].filter((r) => r.amount > 0 || r.tone === 'goal' || r.tone === 'flex')
}

export function MoneyActionCard() {
  const { state, dispatch } = useApp()
  const { user, goal, move } = useDerived()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const [celebrate, setCelebrate] = useState<Celebration | null>(null)
  const host = useHost()
  const rows = moveRows(move, goal?.name ?? 'Goal')
  // Every rupee of income has a job: essentials first, then the monthly move.
  const essentials = user.income - user.monthlyAvailable
  const waterfall = [{ label: 'Essentials (rent, food, bills)', amount: essentials, color: 'bg-ink/40', tone: 'essential' as const }, ...rows]
  const planned = !!goal?.plan
  const done = state.movedThisMonth
  const plan = activePlan(goal, user)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-[19px] font-semibold leading-tight">Where your {inr(user.income)} goes</div>
          <div className="label mt-1">{thisMonth()} · your monthly move</div>
        </div>
        {done && <Pill tone="mint"><CheckIcon width={12} height={12} strokeWidth={3} /> Done</Pill>}
      </div>
      <div className="mt-4 space-y-2.5">
        {waterfall.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-[15px]">
            <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
            <span className="num font-display font-semibold w-[72px]">{inr(r.amount)}</span>
            <span className="text-ink-3">→</span>
            <span className="text-ink-2 truncate">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4"><SplitBar height={8} parts={waterfall.map((r) => ({ value: r.amount, tone: r.tone }))} /></div>
      <div className="mt-5">
        {!planned ? (
          <Button className="w-full" variant="dark" onClick={() => goal && nav(`/goals/${goal.id}`)}>Plan your {goal?.name} first</Button>
        ) : done ? (
          <div className="space-y-2">
            <p className="text-[13px] text-ink-3 text-center">Nice. Your money moved where it matters. Next move on the 1st.</p>
            <Button className="w-full" variant="soft" onClick={() => dispatch({ type: 'NEXT_MONTH' })}>Skip to next month (demo)</Button>
          </div>
        ) : (
          <Button className="w-full" onClick={() => setConfirm(true)}>Make this month's move</Button>
        )}
      </div>

      {planned && (
        <button
          role="switch" aria-checked={state.autopilot} onClick={() => dispatch({ type: 'TOGGLE_AUTOPILOT' })}
          className="mt-3 w-full flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3 text-left tap"
        >
          <span>
            <span className="block text-[14px] font-semibold">Autopilot</span>
            <span className="block text-[12px] text-ink-3">{state.autopilot ? 'Your move runs on the 1st.' : 'Run this move for me on the 1st.'}</span>
          </span>
          <span className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${state.autopilot ? 'bg-mint' : 'bg-ink/20'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${state.autopilot ? 'translate-x-5' : ''}`} />
          </span>
        </button>
      )}

      <MoveCelebration info={celebrate} onClose={() => setCelebrate(null)} />

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Confirm this month's move">
        <p className="text-ink-2 text-[15px]">Here's where your {inr(move.total)} goes this month:</p>
        <div className="card p-4 mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-[15px]"><span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />{r.label}</span>
              <span className="num font-display font-semibold">{inr(r.amount)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4 text-[12px]">
          <Pill tone="mint">+40 XP stayed in budget</Pill>
          {move.toInvest > 0 && <Pill tone="violet">+50 XP invested</Pill>}
        </div>
        <Button className="w-full mt-5 h-14 text-base" onClick={() => {
          if (goal) {
            const after = Math.min(goal.targetAmount, goal.currentAmount + move.toGoal)
            setCelebrate({
              name: goal.name, emoji: goal.emoji, amount: move.toGoal, invest: move.toInvest,
              from: pct(goal.currentAmount, goal.targetAmount), to: pct(after, goal.targetAmount),
              date: plan?.date ?? null, xp: move.toInvest > 0 ? 90 : 40,
            })
          }
          dispatch({ type: 'MAKE_MOVE' }); setConfirm(false)
          if (goal) {
            host.trackEvent('dreams_monthly_move_confirmed', { goal: goal.name, total: move.total, invest: move.toInvest })
            if (move.toInvest > 0) host.startSip({ goalId: goal.id, goalName: goal.name, monthlyAmount: move.total, investAmount: move.toInvest })
          }
        }}>
          Move it
        </Button>
        <p className="text-[11px] text-ink-3 text-center mt-3">Demo: simulated. No real money moves.</p>
      </Sheet>
    </div>
  )
}

/* ------------------------- Move celebration ------------------------- */
interface Celebration { name: string; emoji: string; amount: number; invest: number; from: number; to: number; date: string | null; xp: number }

/** The payoff after "Move it": the bar fills, the date is confirmed, the streak ticks. */
function MoveCelebration({ info, onClose }: { info: Celebration | null; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!info) return
    setV(info.from)
    const t = setTimeout(() => setV(info.to), 250)
    return () => clearTimeout(t)
  }, [info])
  return (
    <Sheet open={!!info} onClose={onClose} title="Move made 🎉">
      {info && (
        <div className="pb-2">
          <div className="text-center">
            <div className="text-[44px] leading-none animate-rise">{info.emoji}</div>
            <div className="font-display text-[28px] font-semibold num mt-3">+{inr(info.amount)}</div>
            <div className="text-ink-2 text-[15px]">moved to your {info.name}</div>
          </div>
          <div className="card p-4 mt-5">
            <div className="flex justify-between text-[13px] num">
              <span className="text-ink-3">{Math.round(info.from)}%</span>
              <span className="font-semibold text-mint-dark">{Math.round(info.to)}%</span>
            </div>
            <ProgressBar value={v} height={12} className="mt-2" />
            <p className="text-[13px] text-ink-2 mt-3">
              One month closer{info.date ? <>, still on track for <b>{info.date}</b></> : ''}.
              {info.invest > 0 && <> {inr(info.invest)} went to long-term investing too.</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Pill tone="amber">🔥 {state.streak}-day streak</Pill>
            <Pill tone="mint">+{info.xp} XP</Pill>
          </div>
          <Button className="w-full mt-5" variant="dark" onClick={onClose}>Nice</Button>
          <Button className="w-full mt-2" variant="ghost" onClick={() => { dispatch({ type: 'NEXT_MONTH' }); onClose() }}>
            Skip to next month (demo)
          </Button>
        </div>
      )}
    </Sheet>
  )
}

/* ------------------------- Upcoming moves ------------------------- */
export function UpcomingMoves() {
  const { state } = useApp()
  const { user, goal } = useDerived()
  const rows = upcomingMoves(user, state.movedThisMonth, 3)
  if (!goal || rows.length === 0) return null
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="label">Next moves · on the 1st</div>
        {state.autopilot && <Pill tone="mint">Autopilot on</Pill>}
      </div>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex items-center justify-between text-[14px]">
              <span className="font-semibold">{r.label}</span>
              <span className="num text-ink-2">{r.toGoal > 0 ? `+${inr(r.toGoal)} → ${goal.name}` : `${goal.name} funded`}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <ProgressBar value={r.pct} height={5} className="flex-1" />
              <span className="num text-[11px] text-ink-3 w-8 text-right">{r.pct}%</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[11.5px] text-ink-3 mt-3">{state.autopilot ? 'Autopilot will run these for you.' : 'Turn on Autopilot to run these for you.'}</p>
    </div>
  )
}
