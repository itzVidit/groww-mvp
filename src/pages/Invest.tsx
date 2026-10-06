import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDerived } from '../state/store'
import { INVESTMENTS, fitFor } from '../data/investments'
import type { Investment, User } from '../types'
import { TRENDING } from '../lib/fomo'
import { inr } from '../lib/format'
import { FomoCheck } from '../components/FomoCheck'
import { Disclaimer, Pill, SectionTitle } from '../components/ui'
import { ChevronIcon, ShieldIcon } from '../components/Icons'

export default function Invest() {
  const { user, goal, move } = useDerived()
  const [params, setParams] = useSearchParams()
  const [fomo, setFomo] = useState(false)
  const [openId, setOpenId] = useState<string | null>('index')

  useEffect(() => {
    if (params.get('fomo')) { setFomo(true); setParams({}, { replace: true }) }
  }, [params, setParams])

  return (
    <div className="px-5 pt-5">
      <h1 className="font-display text-[30px] font-semibold tracking-tight">Invest</h1>
      <p className="text-ink-3 mt-1">Long-term money, explained like a human would.</p>

      {/* Your investing, in context of goals */}
      <div className="card p-5 mt-6">
        <div className="label">Your long-term money</div>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="font-display text-[28px] font-semibold num">{inr(move.toInvest)}</span>
          <span className="text-ink-3 text-sm">/ month</span>
        </div>
        <div className="mt-3 flex gap-2.5 rounded-2xl bg-mint-soft/70 p-3 text-[13px] text-ink-2 leading-snug">
          <ShieldIcon width={18} height={18} className="text-mint-dark shrink-0 mt-px" />
          <span>Your {goal?.name ?? 'goal'} money stays out of the market. It's needed soon, so it shouldn't ride the ups and downs.</span>
        </div>
      </div>

      {/* Trending → FOMO Check */}
      <SectionTitle>Everyone's talking about</SectionTitle>
      <button onClick={() => setFomo(true)} className="w-full text-left rounded-3xl p-5 bg-paper-card border-2 border-coral/20 shadow-card hover:shadow-lift transition">
        <div className="flex items-center justify-between">
          <Pill tone="coral">🔥 Trending stock</Pill>
          <span className="text-[11px] text-ink-3">Hypothetical</span>
        </div>
        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="font-display text-[22px] font-semibold">{TRENDING.name}</div>
            <div className="text-[13px] text-ink-3 mt-0.5">“{TRENDING.blurb}”</div>
          </div>
          <div className="font-display text-2xl font-semibold text-mint-dark num">+{TRENDING.change7d}%</div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink text-white px-4 h-12">
          <span className="font-semibold text-[15px]">Invest in {TRENDING.name}</span>
          <span className="text-[12px] text-white/60 flex items-center gap-1">FOMO Check first <ChevronIcon width={14} height={14} /></span>
        </div>
      </button>

      {/* Categories */}
      <SectionTitle>Four ways to start</SectionTitle>
      <div className="space-y-2.5">
        {INVESTMENTS.map((inv) => (
          <InvestmentCard key={inv.id} inv={inv} user={user} open={openId === inv.id} onToggle={() => setOpenId(openId === inv.id ? null : inv.id)} />
        ))}
      </div>

      <Disclaimer className="mt-5">
        Hypothetical categories for learning. No live prices, no real trading. Not investment advice. All investments can lose value.
      </Disclaimer>

      <FomoCheck open={fomo} onClose={() => setFomo(false)} />
    </div>
  )
}

const RISK_TONE = { Low: 'mint', Medium: 'amber', High: 'coral' } as const
const FIT_TONE = { good: 'mint', ok: 'ink', careful: 'amber' } as const

function InvestmentCard({ inv, user, open, onToggle }: { inv: Investment; user: User; open: boolean; onToggle: () => void }) {
  const fit = fitFor(inv, user)
  return (
    <div className="card overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-4 flex items-center gap-3" aria-expanded={open}>
        <div className="w-11 h-11 rounded-2xl bg-paper grid place-items-center text-xl shrink-0">{inv.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-ink-3 font-semibold uppercase tracking-wide">{inv.category}</div>
          <div className="font-semibold truncate">{inv.name}</div>
        </div>
        <Pill tone={FIT_TONE[fit.tone]}>{fit.label}</Pill>
        <ChevronIcon width={16} height={16} className={`text-ink-4 transition ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade">
          <p className="text-[14px] text-ink-2">{inv.description}</p>
          <div className="flex gap-2 mt-3">
            <Pill tone={RISK_TONE[inv.risk]}>Risk: {inv.risk}</Pill>
            <Pill>Hold: {inv.timeHorizon}</Pill>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-3">
            <div className="rounded-2xl bg-mint-soft/60 p-3">
              <div className="text-[11px] font-bold text-mint-dark uppercase tracking-wide">Why it might fit</div>
              <div className="text-[14px] mt-0.5">{inv.whyFits}</div>
            </div>
            <div className="rounded-2xl bg-coral-soft/60 p-3">
              <div className="text-[11px] font-bold text-[#B23A2E] uppercase tracking-wide">Key downside</div>
              <div className="text-[14px] mt-0.5">{inv.downside}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
