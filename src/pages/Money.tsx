import { RewardsChip } from '../components/RewardsBar'
import { tierFor } from '../lib/rewards'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useDerived } from '../state/store'
import { useLayout } from '../lib/layout'
import { healthLabel, PILLAR_HINT, PILLARS, topPriority } from '../lib/health'
import { inr, pct } from '../lib/format'
import { ScoreRing, scoreTone } from '../components/ScoreRing'
import { Button, Disclaimer, Pill, ProgressBar, SectionTitle, Sheet } from '../components/ui'
import { FlameIcon } from '../components/Icons'

export default function Money() {
  const { state, dispatch } = useApp()
  const { user, goal, health } = useDerived()
  const { web } = useLayout()
  const nav = useNavigate()
  const [bufferSheet, setBufferSheet] = useState(false)
  const [monthly, setMonthly] = useState(1000)
  const priority = topPriority(user, health)
  const buffer = user.goals.find((g) => g.kind === 'buffer')
  const delta = state.startHealth !== null ? health.total - state.startHealth : 0

  const act = () => {
    switch (priority.key) {
      case 'emergencyScore': return setBufferSheet(true)
      case 'goalScore':
      case 'investingScore': return goal && nav(`/goals/${goal.id}`)
      default: return nav('/agent?q=' + encodeURIComponent('How am I doing?'))
    }
  }

  const score = (
    <div className="card p-6 flex items-center gap-5">
      <ScoreRing value={health.total} size={124} stroke={11} label="out of 100" />
      <div>
        <div className="font-display text-xl font-semibold leading-tight">{healthLabel(health.total)}</div>
        {delta !== 0 && (
          <div className={`mt-2 text-[13px] font-semibold ${delta > 0 ? 'text-mint-dark' : 'text-coral'}`}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} since you started
          </div>
        )}
        <div className="mt-2 text-[13px] text-ink-3 leading-snug">Built from 5 everyday habits, not your bank balance.</div>
      </div>
    </div>
  )

  const priorityCard = (
    <div className="rounded-3xl bg-ink text-white p-5">
      <div className="text-[11px] uppercase tracking-widest font-semibold text-amber">Your #1 priority</div>
      <h2 className="font-display text-[21px] leading-snug font-semibold mt-2">{priority.title}</h2>
      {buffer && priority.key === 'emergencyScore' ? (
        <>
          <p className="text-white/70 text-[14px] mt-2">Buffer started. It fills {inr(buffer.monthlyContribution)} with each monthly move.</p>
          <div className="mt-4 flex justify-between text-[13px] num"><span>{inr(buffer.currentAmount)}</span><span className="text-white/50">{inr(buffer.targetAmount)}</span></div>
          <ProgressBar value={pct(buffer.currentAmount, buffer.targetAmount)} tone="amber" className="mt-2 !bg-white/10" />
        </>
      ) : (
        <>
          <p className="text-white/70 text-[14px] mt-2 leading-relaxed">{priority.body}</p>
          <Button className="w-full mt-4" onClick={act}>{priority.cta}</Button>
        </>
      )}
    </div>
  )

  const breakdown = (
    <div className="card divide-y divide-paper-line">
      {PILLARS.map((p) => {
        const v = health[p.key]
        const isPriority = p.key === priority.key
        return (
          <div key={p.key} className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[15px] flex items-center gap-2">
                {p.label}
                {isPriority && <Pill tone="amber" className="!py-0 !text-[10px]">Focus</Pill>}
              </span>
              <span className="font-display font-semibold num" style={{ color: scoreTone(v) }}>{v}</span>
            </div>
            <ProgressBar value={v} height={6} tone={v >= 75 ? 'mint' : v >= 60 ? 'amber' : 'coral'} className="mt-2" />
            <p className="text-[12.5px] text-ink-3 mt-1.5">{PILLAR_HINT[p.key](user)}</p>
          </div>
        )
      })}
    </div>
  )

  const habits = (
    <details className="card p-5 group">
      <summary className="list-none cursor-pointer flex items-center gap-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <span className="w-10 h-10 rounded-full bg-amber-soft text-[#9A6412] grid place-items-center"><FlameIcon width={20} height={20} /></span>
          <div><div className="font-display font-semibold text-lg leading-none">{state.streak} days</div><div className="text-[11px] text-ink-3 mt-1">Money streak</div></div>
        </div>
        <div className="w-px h-9 bg-paper-line" />
        <div><div className="font-display font-semibold text-lg leading-none num">{state.xp}</div><div className="text-[11px] text-ink-3 mt-1">XP · {tierFor(state.xp).tier.name}</div></div>
        <span className="ml-auto text-[12px] font-semibold text-ink-3 group-open:hidden">Show</span>
      </summary>
      <ul className="mt-4 space-y-2.5">
        {state.xpLog.slice(0, 6).map((e) => (
          <li key={e.id} className="flex items-center justify-between text-[14px]">
            <span className="text-ink-2">{e.label}</span>
            <span className="font-semibold text-mint-dark num">+{e.xp} XP</span>
          </li>
        ))}
      </ul>
      <div className="mt-4"><RewardsChip /></div>
      <p className="text-[11.5px] text-ink-3 mt-4 pt-3 border-t border-paper-line">
        XP rewards saving, learning, consistency and pausing before impulse buys. Never trading.
      </p>
    </details>
  )

  const disclaimer = (
    <Disclaimer className="mt-5">
      Money Health is a behavioural score for this demo, not a credit score or financial advice. Credit data is a sample profile.
    </Disclaimer>
  )

  const bufferModal = (
    <Sheet open={bufferSheet} onClose={() => setBufferSheet(false)} title="🛟 Build a ₹5,000 buffer">
      <p className="text-ink-2 text-[15px] leading-relaxed">
        A buffer catches surprises (a phone repair, a medical bill) so they don't eat your {goal?.name ?? 'goal'} money or land on a credit card.
      </p>
      <div className="mt-4 space-y-2">
        {[1000, 500].map((m) => (
          <button key={m} onClick={() => setMonthly(m)}
            className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 border-2 transition ${monthly === m ? 'border-mint bg-paper-card' : 'border-paper-line'}`}>
            <span className="font-semibold">{inr(m)}/month</span>
            <span className="text-ink-3 text-sm">Done in {5000 / m} months</span>
          </button>
        ))}
      </div>
      <p className="text-[12.5px] text-ink-3 mt-3">Comes out of your flexible money first, so your {goal?.name ?? 'goal'} date doesn't move.</p>
      <Button className="w-full h-14 mt-5" onClick={() => { dispatch({ type: 'START_BUFFER', monthly }); setBufferSheet(false) }}>
        Start my buffer
      </Button>
    </Sheet>
  )

  if (web) {
    return (
      <div>
        <h1 className="font-display text-[40px] font-semibold tracking-tight">Money Health</h1>
        <p className="text-ink-3 mt-1">Are you getting financially healthier? One number, one next step.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2 items-start">
          <div className="space-y-4">
            {score}
            {priorityCard}
            <div>
              <h2 className="font-display text-[17px] font-semibold tracking-tight mb-3 mt-3">Your habits</h2>
              {habits}
            </div>
          </div>
          <div>
            <h2 className="font-display text-[17px] font-semibold tracking-tight mb-3">Breakdown</h2>
            {breakdown}
            {disclaimer}
          </div>
        </div>
        {bufferModal}
      </div>
    )
  }

  return (
    <div className="px-5 pt-5">
      <h1 className="font-display text-[30px] font-semibold tracking-tight">Money Health</h1>
      <p className="text-ink-3 mt-1">Are you getting financially healthier? One number, one next step.</p>

      <div className="mt-6">{score}</div>
      <div className="mt-3">{priorityCard}</div>

      <SectionTitle>Breakdown</SectionTitle>
      {breakdown}

      <SectionTitle>Your habits</SectionTitle>
      {habits}

      {disclaimer}
      <button onClick={() => { dispatch({ type: 'RESET' }); nav('/welcome') }} className="mt-4 text-[13px] font-semibold text-ink-3 underline underline-offset-4">
        Restart demo
      </button>

      {bufferModal}
    </div>
  )
}
