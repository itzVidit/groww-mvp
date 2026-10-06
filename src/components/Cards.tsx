import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Goal } from '../types'
import { inr, pct, thisMonth } from '../lib/format'
import { activePlan, type MonthlyMove } from '../lib/plan'
import { useApp, useDerived } from '../state/store'
import { Button, Pill, ProgressBar, Sheet, SplitBar } from './ui'
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
  ].filter((r) => r.amount > 0 || r.tone === 'goal' || r.tone === 'flex')
}

export function MoneyActionCard() {
  const { state, dispatch } = useApp()
  const { goal, move } = useDerived()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const rows = moveRows(move, goal?.name ?? 'Goal')
  const planned = !!goal?.plan
  const done = state.movedThisMonth

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="label">This month's move · {thisMonth()}</div>
        {done && <Pill tone="mint"><CheckIcon width={12} height={12} strokeWidth={3} /> Done</Pill>}
      </div>
      <div className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-[15px]">
            <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
            <span className="num font-display font-semibold w-[72px]">{inr(r.amount)}</span>
            <span className="text-ink-3">→</span>
            <span className="text-ink-2 truncate">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4"><SplitBar height={8} parts={rows.map((r) => ({ value: r.amount, tone: r.tone }))} /></div>
      <div className="mt-5">
        {!planned ? (
          <Button className="w-full" variant="dark" onClick={() => goal && nav(`/goals/${goal.id}`)}>Plan your {goal?.name} first</Button>
        ) : done ? (
          <p className="text-[13px] text-ink-3 text-center">Nice. Your money moved where it matters. Next move on the 1st.</p>
        ) : (
          <Button className="w-full" onClick={() => setConfirm(true)}>Make this month's move</Button>
        )}
      </div>

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
        <Button className="w-full mt-5 h-14 text-base" onClick={() => { dispatch({ type: 'MAKE_MOVE' }); setConfirm(false) }}>
          Move it
        </Button>
        <p className="text-[11px] text-ink-3 text-center mt-3">Demo: simulated. No real money moves.</p>
      </Sheet>
    </div>
  )
}
