import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useDerived } from '../state/store'
import { useLayout } from '../lib/layout'
import { healthLabel, topPriority } from '../lib/health'
import { GoalCard, MoneyActionCard, UpcomingMoves } from '../components/Cards'
import { MoneyMinuteRow } from '../components/MoneyMinute'
import { AffordSheet } from '../components/AffordIt'
import { ScoreRing } from '../components/ScoreRing'
import { SectionTitle } from '../components/ui'
import { ChevronIcon, FlameIcon, SparkIcon } from '../components/Icons'
import { SUGGESTED_PROMPTS } from '../lib/agent'

export default function Home() {
  const { state } = useApp()
  const { user, goal, health } = useDerived()
  const { web } = useLayout()
  const nav = useNavigate()
  const [afford, setAfford] = useState(false)
  const priority = topPriority(user, health)
  const delta = state.startHealth !== null ? health.total - state.startHealth : 0

  const noGoal = (
    <button onClick={() => nav('/goals')} className="card w-full p-6 text-left hover:shadow-lift transition">
      <div className="text-3xl">🎯</div>
      <div className="font-display text-lg font-semibold mt-2">Pick something you want</div>
      <p className="text-[14px] text-ink-3 mt-1">A goal turns "someday" into a monthly number. Start with one.</p>
    </button>
  )

  const healthCard = (
    <button onClick={() => nav('/money')} className="card w-full p-5 text-left flex items-center gap-4 hover:shadow-lift transition animate-rise" style={{ animationDelay: '120ms' }}>
      <ScoreRing value={health.total} size={76} stroke={7} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="label">Money Health</span>
          {delta > 0 && <span className="text-[11px] font-bold text-mint-dark">▲ {delta}</span>}
        </div>
        <div className="font-semibold mt-1">{healthLabel(health.total)}</div>
        <div className="text-[13px] text-ink-3 mt-0.5 leading-snug line-clamp-2">Next: {priority.title}</div>
      </div>
      <ChevronIcon width={18} height={18} className="text-ink-4" />
    </button>
  )

  // The three pillars, one tap each. The agent (below) is the front door to all of them.
  const pillars = [
    { emoji: '🎯', title: 'Dream → Money', hint: 'Plan a goal', go: () => (goal ? nav(`/goals/${goal.id}`) : nav('/goals')) },
    { emoji: '🤔', title: 'Can I afford it?', hint: 'Buy, build or wait', go: () => setAfford(true) },
    { emoji: '🛡️', title: 'FOMO Shield', hint: 'Pause the hype', go: () => nav('/invest?fomo=1') },
  ]
  const pillarRow = (
    <div className="grid grid-cols-3 gap-2 animate-rise" style={{ animationDelay: '90ms' }}>
      {pillars.map((p) => (
        <button key={p.title} onClick={p.go} className="card p-3 text-left hover:shadow-lift transition">
          <span className="text-[20px] leading-none">{p.emoji}</span>
          <div className="mt-2 text-[13px] font-semibold leading-tight">{p.title}</div>
          <div className="text-[11px] text-ink-3 mt-0.5">{p.hint}</div>
        </button>
      ))}
    </div>
  )

  const agentCard = (
    <div className="rounded-3xl bg-ink text-white p-5 animate-rise" style={{ animationDelay: '180ms' }}>
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-white/10 grid place-items-center"><SparkIcon width={18} height={18} className="text-mint" /></span>
        <div>
          <div className="font-semibold">Money Agent</div>
          <div className="text-[12px] text-white/50">Your coach. Knows your numbers, skips the jargon.</div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {SUGGESTED_PROMPTS.slice(0, web ? 3 : 2).map((p) => (
          <button key={p} onClick={() => nav('/agent?q=' + encodeURIComponent(p))}
            className="text-left text-[14px] rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] px-4 py-3 transition flex justify-between items-center">
            “{p}”
            <ChevronIcon width={16} height={16} className="text-white/40" />
          </button>
        ))}
      </div>
    </div>
  )

  const minuteTitle = (
    <SectionTitle action={<span className="text-[12px] text-ink-3">{state.completedLessons.length}/5 done</span>}>
      Money Minute
    </SectionTitle>
  )

  if (web) {
    return (
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-ink-2 font-medium">Hey {user.name} 👋</div>
            <h1 className="font-display text-[40px] leading-[1.05] font-semibold tracking-tight mt-1">Your money, moving somewhere.</h1>
          </div>
          <div className="flex items-center gap-2 xl:hidden">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft text-[#9A6412] px-3 h-9 text-[13px] font-bold"><FlameIcon width={15} height={15} /> {state.streak}-day streak</span>
            <span className="inline-flex items-center rounded-full bg-ink text-white px-3 h-9 text-[13px] font-bold num">{state.xp} XP</span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
          <div className="min-w-0">
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <div className="animate-rise space-y-4">{goal ? <GoalCard goal={goal} /> : noGoal}<UpcomingMoves /></div>
              <div className="animate-rise" style={{ animationDelay: '60ms' }}><MoneyActionCard /></div>
            </div>
            <div className="mt-4">{pillarRow}</div>
            {minuteTitle}
            <MoneyMinuteRow />
          </div>
          <aside className="space-y-4 lg:sticky lg:top-0">
            {healthCard}
            {agentCard}
          </aside>
        </div>
        <AffordSheet key={String(afford)} open={afford} onClose={() => setAfford(false)} />
      </div>
    )
  }

  return (
    <div className="px-5 pt-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div className="text-ink-2 font-medium">Hey {user.name} 👋</div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft text-[#9A6412] px-2.5 h-8 text-[13px] font-bold">
            <FlameIcon width={15} height={15} /> {state.streak}-day streak
          </span>
          <span className="inline-flex items-center rounded-full bg-ink text-white px-2.5 h-8 text-[13px] font-bold num">{state.xp} XP</span>
        </div>
      </div>
      <h1 className="font-display text-[30px] leading-[1.08] font-semibold tracking-tight mt-4">
        Your money,<br />moving somewhere.
      </h1>

      {/* Active goal */}
      <div className="mt-6 animate-rise">{goal ? <GoalCard goal={goal} /> : noGoal}</div>

      {/* This month's move */}
      <div className="mt-3 animate-rise" style={{ animationDelay: '60ms' }}><MoneyActionCard /></div>

      <div className="mt-3"><UpcomingMoves /></div>

      {/* The three pillars */}
      <div className="mt-3">{pillarRow}</div>

      {/* Money health */}
      <div className="mt-3">{healthCard}</div>

      {/* Money Agent */}
      <div className="mt-3">{agentCard}</div>

      {/* Money Minute */}
      {minuteTitle}
      <MoneyMinuteRow />

      <AffordSheet key={String(afford)} open={afford} onClose={() => setAfford(false)} />
    </div>
  )
}
