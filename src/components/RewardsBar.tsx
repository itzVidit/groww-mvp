import { useState } from 'react'
import { useApp } from '../state/store'
import { FlameIcon } from './Icons'
import { ProgressBar, Sheet } from './ui'
import { KIND_EMOJI, STREAK_REWARDS, TIERS, nextStreakReward, tierFor } from '../lib/rewards'

/** One tappable chip (tier + streak) that opens the rewards sheet. Replaces the old static pills. */
export function RewardsChip({ className = '' }: { className?: string }) {
  const { state } = useApp()
  const [open, setOpen] = useState(false)
  const { tier, pct } = tierFor(state.xp)
  const unclaimed = STREAK_REWARDS.filter((r) => state.streak >= r.days && !state.claimed.includes(r.id)).length
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`${tier.name} tier, ${state.streak} streak, ${state.xp} XP. Open rewards`}
        className={`relative inline-flex items-center gap-2 rounded-full bg-paper-card border border-paper-line pl-1.5 pr-3 h-9 text-[13px] font-bold hover:border-ink/25 transition whitespace-nowrap ${className}`}
      >
        <span className="relative w-6 h-6 rounded-full grid place-items-center text-[13px]" style={{ background: `conic-gradient(#00B386 ${pct}%, #E8EBEF 0)` }}>
          <span className="absolute inset-[2.5px] rounded-full bg-paper-card" />
          <span className="relative">{tier.emoji}</span>
        </span>
        <span>{tier.name}</span>
        <span className="inline-flex items-center gap-0.5 text-[#9A6412]"><FlameIcon width={14} height={14} />{state.streak}</span>
        {unclaimed > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-coral text-white text-[10px] grid place-items-center">{unclaimed}</span>}
      </button>
      <RewardsSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function RewardsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp()
  const { tier, next, pct, toNext } = tierFor(state.xp)
  const upcoming = nextStreakReward(state.streak)
  return (
    <Sheet open={open} onClose={onClose} title="Your rewards" tall>
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{tier.emoji}</span>
          <div className="flex-1">
            <div className="font-display text-lg font-semibold leading-none">{tier.name} tier</div>
            <div className="text-[12px] text-ink-3 mt-1 num">{state.xp} XP{next ? ` · ${toNext} to ${next.name}` : ' · top tier'}</div>
          </div>
        </div>
        <ProgressBar value={pct} className="mt-3" />
      </div>

      <div className="label mt-6">Tiers and perks</div>
      <ul className="mt-2 space-y-2">
        {TIERS.map((t) => {
          const reached = state.xp >= t.minXp
          return (
            <li key={t.id} className={`card p-3.5 flex gap-3 ${reached ? '' : 'opacity-60'}`}>
              <span className="text-xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[14px] font-semibold"><span>{t.name}{t.id === tier.id && ' · you'}</span><span className="text-ink-3 num font-medium">{t.minXp} XP</span></div>
                <div className="text-[12.5px] text-ink-2 mt-0.5">{t.perks.join(' · ')}</div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="label mt-6">Streak rewards</div>
      <p className="text-[12.5px] text-ink-3 mt-1">
        {upcoming ? `${upcoming.days - state.streak} more to unlock “${upcoming.title}”.` : 'You have unlocked every streak reward.'}
      </p>
      <ul className="mt-2 space-y-2">
        {STREAK_REWARDS.map((r) => {
          const unlocked = state.streak >= r.days
          const claimed = state.claimed.includes(r.id)
          return (
            <li key={r.id} className={`card p-3.5 flex items-center gap-3 ${unlocked ? '' : 'opacity-60'}`}>
              <span className="text-xl">{KIND_EMOJI[r.kind]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold">{r.title}</div>
                <div className="text-[12.5px] text-ink-2">{r.detail}</div>
              </div>
              {claimed ? (
                <span className="text-[12px] font-semibold text-mint-dark">Claimed</span>
              ) : unlocked ? (
                <button onClick={() => dispatch({ type: 'CLAIM_REWARD', id: r.id, title: r.title })} className="h-8 px-3 rounded-full bg-mint text-white text-[13px] font-bold">Claim</button>
              ) : (
                <span className="text-[12px] font-semibold text-ink-3 num">{r.days} streak</span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-[11.5px] text-ink-3 mt-5 pb-4">
        Concept rewards for the demo. XP comes from saving, learning and pausing before impulse buys, never from trading more.
      </p>
    </Sheet>
  )
}
