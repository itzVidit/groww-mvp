import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDerived } from '../state/store'
import { useLayout } from '../lib/layout'
import { useHost } from '../integration/host'
import { INVESTMENTS, fitFor } from '../data/investments'
import type { Investment, User } from '../types'
import { TRENDING, TRENDING_ASSETS, type TrendingAsset } from '../lib/fomo'
import { inr } from '../lib/format'
import { FomoCheck } from '../components/FomoCheck'
import { ReturnsCompare } from '../components/ReturnsCompare'
import { Disclaimer, Pill, SectionTitle } from '../components/ui'
import { ChevronIcon, ShieldIcon } from '../components/Icons'

export default function Invest() {
  const { user, goal, move } = useDerived()
  const { web } = useLayout()
  const host = useHost()
  const [params, setParams] = useSearchParams()
  const [fomo, setFomo] = useState<TrendingAsset | null>(null)
  const [openId, setOpenId] = useState<string | null>('index')

  useEffect(() => {
    const q = params.get('fomo')
    if (q) { setFomo(TRENDING_ASSETS.find((a) => a.id === q) ?? TRENDING); setParams({}, { replace: true }) }
    if (params.get('returns')) {
      setParams({}, { replace: true })
      requestAnimationFrame(() => document.getElementById('returns')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }, [params, setParams])

  const monthly = (
    <div className="card p-5">
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
  )

  const trendingCard = (t: TrendingAsset) => (
    <button key={t.id} onClick={() => setFomo(t)} className="w-full text-left rounded-3xl p-5 bg-paper-card border-2 border-coral/20 shadow-card hover:shadow-lift transition">
      <div className="flex items-center justify-between">
        <Pill tone={t.volatility === 'Low' ? 'mint' : 'coral'}>{t.kind}</Pill>
        <span className="text-[11px] text-ink-3">Hypothetical</span>
      </div>
      <div className="flex items-end justify-between mt-4">
        <div>
          <div className="font-display text-[22px] font-semibold">{t.emoji} {t.name}</div>
          <div className="text-[13px] text-ink-3 mt-0.5">“{t.blurb}”</div>
        </div>
        <div className="font-display text-2xl font-semibold text-mint-dark num">+{t.change7d}%</div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink text-white px-4 h-12">
        <span className="font-semibold text-[15px]">Invest in {t.name}</span>
        <span className="text-[12px] text-white/60 flex items-center gap-1">FOMO Shield first <ChevronIcon width={14} height={14} /></span>
      </div>
    </button>
  )
  const trending = <div className="space-y-3">{TRENDING_ASSETS.map(trendingCard)}</div>

  const categories = (
    <div className={web ? 'grid gap-3 md:grid-cols-2 items-start' : 'space-y-2.5'}>
      {INVESTMENTS.map((inv) => (
        <InvestmentCard key={inv.id} inv={inv} user={user} onExplore={() => host.openProduct({ id: inv.id, category: inv.category, name: inv.name })} open={openId === inv.id} onToggle={() => setOpenId(openId === inv.id ? null : inv.id)} />
      ))}
    </div>
  )

  const disclaimer = (
    <Disclaimer className="mt-5">
      Hypothetical categories for learning. No live prices, no real trading. Not investment advice. All investments can lose value.
    </Disclaimer>
  )

  if (web) {
    return (
      <div>
        <h1 className="font-display text-[40px] font-semibold tracking-tight">Invest</h1>
        <p className="text-ink-3 mt-1">Long-term money, explained like a human would.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
          <div className="min-w-0">
            <ReturnsCompare />
            <h2 className="font-display text-[17px] font-semibold tracking-tight mb-3 mt-8">Four ways to start</h2>
            {categories}
            {disclaimer}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-0">
            {monthly}
            <div>
              <h2 className="font-display text-[17px] font-semibold tracking-tight mb-3">Everyone's talking about</h2>
              {trending}
            </div>
          </aside>
        </div>
        <FomoCheck asset={fomo} onClose={() => setFomo(null)} />
      </div>
    )
  }

  return (
    <div className="px-5 pt-5">
      <h1 className="font-display text-[30px] font-semibold tracking-tight">Invest</h1>
      <p className="text-ink-3 mt-1">Long-term money, explained like a human would.</p>

      <div className="mt-6">{monthly}</div>

      <SectionTitle>Everyone's talking about</SectionTitle>
      {trending}

      <div className="mt-7"><ReturnsCompare /></div>

      <SectionTitle>Four ways to start</SectionTitle>
      {categories}

      {disclaimer}

      <FomoCheck asset={fomo} onClose={() => setFomo(null)} />
    </div>
  )
}

const RISK_TONE = { Low: 'mint', Medium: 'amber', High: 'coral' } as const
const FIT_TONE = { good: 'mint', ok: 'ink', careful: 'amber' } as const

function InvestmentCard({ inv, user, open, onToggle, onExplore }: { inv: Investment; user: User; open: boolean; onToggle: () => void; onExplore: () => void }) {
  const fit = fitFor(inv, user)
  return (
    <div id={`inv-${inv.id}`} className="card overflow-hidden">
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
          <button onClick={onExplore} className="mt-3 w-full h-10 rounded-xl border border-mint/40 text-mint-dark text-[14px] font-semibold hover:bg-mint-soft transition">
            Explore on Groww
          </button>
        </div>
      )}
    </div>
  )
}
