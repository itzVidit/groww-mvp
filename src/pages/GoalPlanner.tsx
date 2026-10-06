import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../state/store'
import type { PlanId } from '../types'
import { inr, pct } from '../lib/format'
import { computeHealth } from '../lib/health'
import { horizonNote, PLAN_RECOMMENDED, planOptions, remainingFor, type PlanOption } from '../lib/plan'
import { Button, Disclaimer, PageHeader, Pill, ProgressBar, SplitBar } from '../components/ui'
import { CheckIcon } from '../components/Icons'

export default function GoalPlanner() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const user = state.user
  const goal = user.goals.find((g) => g.id === id)

  const [months, setMonths] = useState(goal?.targetMonths ?? 4)
  const [selected, setSelected] = useState<PlanId>(goal?.plan ?? PLAN_RECOMMENDED)

  const options = useMemo(() => (goal ? planOptions(goal, user, months) : []), [goal, user, months])
  const healthFor = useMemo(() => {
    if (!goal) return {} as Record<PlanId, number>
    const out = {} as Record<PlanId, number>
    for (const o of options) {
      const u = { ...user, activeGoalId: goal.id, goals: user.goals.map((g) => (g.id === goal.id ? { ...g, plan: o.id, targetMonths: months } : g)) }
      out[o.id] = computeHealth(u).total
    }
    return out
  }, [goal, user, options, months])

  if (!goal) return <Navigate to="/goals" replace />

  const remaining = remainingFor(goal)
  const progress = pct(goal.currentAmount, goal.targetAmount)
  const chosen = options.find((o) => o.id === selected)!
  const isLocked = goal.plan === selected && goal.targetMonths === months
  const freeMonths = remaining / user.monthlyAvailable
  const maxMonths = Math.max(24, goal.targetMonths * 2)

  const lock = () => {
    dispatch({ type: 'SET_PLAN', goalId: goal.id, plan: selected, months })
    if (goal.kind !== 'buffer') dispatch({ type: 'SET_ACTIVE_GOAL', goalId: goal.id })
    nav('/home')
  }

  if (remaining === 0)
    return (
      <>
        <PageHeader back="/goals" />
        <div className="px-6 py-10 text-center flex-1">
          <div className="text-7xl mb-4">{goal.emoji}</div>
          <h1 className="font-display text-3xl font-semibold">{goal.name}: funded! 🎉</h1>
          <p className="mt-3 text-ink-2">You saved {inr(goal.targetAmount)} without touching your future. Enjoy it, you planned for it.</p>
          <Button className="mt-8 w-full" onClick={() => nav('/goals')}>Pick your next goal</Button>
        </div>
      </>
    )

  return (
    <>
      <PageHeader back="/home" title={<span className="text-ink-3 text-sm font-sans font-medium">Dream → Money</span>} />

      <div className="px-5 pb-36">
        {/* Goal hero */}
        <section className="animate-rise">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[20px] bg-paper-card shadow-card border border-paper-line grid place-items-center text-[34px]">{goal.emoji}</div>
            <div>
              <h1 className="font-display text-[28px] font-semibold tracking-tight leading-none">{goal.name}</h1>
              <div className="mt-1.5 text-ink-2 num text-[15px]">{inr(goal.targetAmount)}</div>
            </div>
          </div>

          <div className="card p-5 mt-5">
            <div className="flex items-baseline justify-between">
              <div className="num"><span className="font-display text-2xl font-semibold">{inr(goal.currentAmount)}</span> <span className="text-ink-3 text-sm">saved</span></div>
              <div className="font-display text-lg font-semibold text-mint-dark num">{Math.round(progress)}%</div>
            </div>
            <ProgressBar value={progress} height={10} className="mt-3" />
            <div className="mt-3 flex justify-between text-[13px] text-ink-3">
              <span className="num">{inr(remaining)} to go</span>
              <span>Want it in {months} month{months > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* What it really costs */}
          <div className="mt-3 rounded-2xl bg-ink text-white p-4 flex gap-3 items-start">
            <div className="text-xl leading-none mt-0.5">💡</div>
            <p className="text-[13.5px] leading-relaxed text-white/85">
              What's left is about <b className="text-white">{freeMonths < 1 ? 'less than one month' : `${freeMonths.toFixed(1)} months`}</b> of
              your free money ({inr(user.monthlyAvailable)}/mo after essentials). The question isn't <i>if</i>, it's <i>how</i>.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="mt-7">
          <h2 className="font-display text-[22px] font-semibold tracking-tight">How do you want to reach it?</h2>
          <p className="text-ink-3 text-sm mt-1">Here's what your money needs to do each month.</p>
          <div className="mt-4 space-y-3" role="radiogroup">
            {options.map((o, i) => (
              <PlanOptionCard
                key={o.id} option={o} goalName={goal.name} available={user.monthlyAvailable}
                selected={o.id === selected} recommended={o.id === PLAN_RECOMMENDED}
                health={healthFor[o.id]} onSelect={() => setSelected(o.id)} delay={i * 70}
              />
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mt-5 card px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[15px]">Fastest date I'd like it by</h2>
            <span className="num font-semibold text-sm">{months} mo</span>
          </div>
          <input
            type="range" min={1} max={maxMonths} value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full mt-3" aria-label="Target months"
          />
          <div className="flex justify-between text-[11px] text-ink-3 -mt-0.5"><span>1 month</span><span>{maxMonths} months</span></div>
        </section>

        {/* Where the money goes */}
        <section className="mt-7 card p-5">
          <div className="label">With "{chosen.title}", each month</div>
          <div className="mt-4 space-y-4">
            <MoneyRow color="bg-mint" amount={chosen.toGoal} title={`→ ${goal.name}`} sub={`${horizonNote(chosen.months).where}. ${horizonNote(chosen.months).why}`} />
            <MoneyRow color="bg-violet" amount={chosen.toInvest} title="→ Long-term investing"
              sub={chosen.investCut > 0 ? `Trimmed by ${inr(chosen.investCut)} while you chase this goal. It bounces back after.` : 'Your future self keeps getting paid. Untouched by this goal.'} />
            <MoneyRow color="bg-ink/20" amount={chosen.flexible} title="→ Flexible spending"
              sub={chosen.flexible > 0 ? 'Yours. Spend it guilt-free.' : 'Nothing left for fun this way. Plans like this are hard to stick to.'} />
          </div>
        </section>

        <Disclaimer className="mt-5">
          Illustrative plan. Goal money is assumed to earn nothing, so we never count on returns to get you there. Not investment advice.
        </Disclaimer>
      </div>

      {/* Sticky CTA */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-paper via-paper to-paper/0 pt-8 px-5 pb-safe">
        <Button className="w-full h-14 text-base" onClick={lock} disabled={isLocked || chosen.shortfall > 0}>
          {isLocked ? <><CheckIcon width={18} height={18} /> Plan locked</> : chosen.shortfall > 0 ? 'Not enough room. Try a later date.' : `Lock this plan · ${inr(chosen.toGoal)}/mo`}
        </Button>
      </div>
    </>
  )
}

function MoneyRow({ color, amount, title, sub }: { color: string; amount: number; title: string; sub: string }) {
  return (
    <div className="flex gap-3">
      <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
      <div className="flex-1">
        <div className="flex justify-between gap-3">
          <span className="font-semibold text-[15px]">{title}</span>
          <span className="font-display font-semibold num">{inr(amount)}</span>
        </div>
        <p className="text-[13px] text-ink-3 mt-0.5 leading-snug">{sub}</p>
      </div>
    </div>
  )
}

function PlanOptionCard({ option: o, goalName, available, selected, recommended, health, onSelect, delay }: {
  option: PlanOption; goalName: string; available: number; selected: boolean; recommended: boolean; health: number; onSelect: () => void; delay: number
}) {
  const tradeoff =
    o.shortfall > 0
      ? { tone: 'coral' as const, text: `Needs ${inr(o.shortfall)} more than you have each month` }
      : o.investCut > 0
        ? { tone: 'amber' as const, text: `Trims your investing by ${inr(o.investCut)}/mo` }
        : o.flexible === 0
          ? { tone: 'amber' as const, text: 'No room for fun money' }
          : { tone: 'mint' as const, text: `Investing intact · ${inr(o.flexible)} free to spend` }

  return (
    <button
      role="radio" aria-checked={selected} onClick={onSelect}
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-rise w-full text-left rounded-3xl p-4 border-2 transition ${selected ? 'border-mint bg-paper-card shadow-card' : 'border-transparent bg-paper-card/60 hover:bg-paper-card'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full border-2 grid place-items-center ${selected ? 'border-mint bg-mint' : 'border-ink-4'}`}>
              {selected && <CheckIcon width={12} height={12} className="text-white" strokeWidth={3} />}
            </span>
            <span className="font-display font-semibold text-[17px] uppercase tracking-wide">{o.title}</span>
            {recommended && <Pill tone="mint" className="!py-0.5">Balanced</Pill>}
          </div>
          <p className="text-[13px] text-ink-3 mt-1 ml-7">{o.tagline}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] text-ink-3">Ready by</div>
          <div className="font-semibold text-sm">{o.date}</div>
        </div>
      </div>

      <div className="mt-4 ml-7">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[26px] font-semibold num leading-none">{inr(o.toGoal)}</span>
          <span className="text-sm text-ink-3">/month → {goalName}</span>
        </div>
        <div className="mt-3">
          <SplitBar parts={[
            { value: Math.min(o.toGoal, available), tone: o.shortfall > 0 ? 'warn' : 'goal' },
            { value: o.toInvest, tone: 'invest' },
            { value: o.flexible, tone: 'flex' },
          ]} />
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[12px] text-ink-3">
            <Legend color="bg-mint" text={`Goal ${inr(o.toGoal)}`} />
            <Legend color="bg-violet" text={`Invest ${inr(o.toInvest)}`} />
            <Legend color="bg-ink/20" text={`Flexible ${inr(o.flexible)}`} />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Pill tone={tradeoff.tone}>{tradeoff.text}</Pill>
          <span className="text-[11px] text-ink-3 whitespace-nowrap">Health <b className="text-ink num">{health}</b></span>
        </div>
      </div>
    </button>
  )
}

const Legend = ({ color, text }: { color: string; text: string }) => (
  <span className="inline-flex items-center gap-1.5 num"><span className={`w-2 h-2 rounded-full ${color}`} />{text}</span>
)
