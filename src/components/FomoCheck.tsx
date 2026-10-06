import { useMemo, useState } from 'react'
import { fomoScore, SIGNALS, TRENDING, type FomoLevel, type FomoSignal } from '../lib/fomo'
import { useApp, useDerived } from '../state/store'
import { Button, Disclaimer, Sheet } from './ui'
import { CheckIcon } from './Icons'

type Stage = 'ask' | 'result' | 'understand' | 'continued' | 'paused'

const LEVEL_STYLE: Record<FomoLevel, { text: string; bg: string; bar: string }> = {
  HIGH: { text: 'text-coral', bg: 'bg-coral-soft', bar: '#EF5B4C' },
  MEDIUM: { text: 'text-[#B87A1C]', bg: 'bg-amber-soft', bar: '#F2A93B' },
  LOW: { text: 'text-mint-dark', bg: 'bg-mint-soft', bar: '#00B386' },
}

export function FomoCheck({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useApp()
  const { user, goal } = useDerived()
  const [stage, setStage] = useState<Stage>('ask')
  const [signals, setSignals] = useState<FomoSignal[]>([])
  const result = useMemo(() => fomoScore(signals, TRENDING, user), [signals, user])
  const a = TRENDING

  const close = () => { onClose(); setTimeout(() => { setStage('ask'); setSignals([]) }, 300) }
  const toggle = (s: FomoSignal) => setSignals((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]))
  const pause = () => {
    dispatch({ type: 'REWARD_ONCE', key: 'fomo-pause', xp: 40, label: 'Avoided an impulse decision' })
    setStage('paused')
  }
  const st = LEVEL_STYLE[result.level]

  return (
    <Sheet open={open} onClose={close} tall>
      {/* Asset strip */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-coral-soft grid place-items-center text-xl">⚡</div>
        <div className="flex-1">
          <div className="font-semibold">{a.name} <span className="text-[11px] font-medium text-ink-3">· hypothetical</span></div>
          <div className="text-[12px] text-ink-3">{a.mentions}</div>
        </div>
        <div className="text-right">
          <div className="font-display font-semibold text-mint-dark num">+{a.change7d}%</div>
          <div className="text-[11px] text-ink-3">this week</div>
        </div>
      </div>

      <div key={stage} className="animate-rise">
        {stage === 'ask' && (
          <>
            <div className="mt-6 label">FOMO Check · 20 seconds</div>
            <h3 className="font-display text-[24px] leading-tight font-semibold mt-2">What made you want to buy {a.name}?</h3>
            <p className="text-ink-3 text-sm mt-1">Pick all that are true. Honest answers only work for you.</p>
            <div className="mt-4 space-y-2">
              {SIGNALS.map((s) => {
                const on = signals.includes(s.id)
                return (
                  <button key={s.id} onClick={() => toggle(s.id)}
                    className={`w-full flex items-center gap-3 text-left rounded-2xl px-4 py-3 border-2 transition ${on ? 'border-ink bg-paper-card' : 'border-paper-line bg-paper-card/60'}`}>
                    <span className={`w-5 h-5 rounded-md border-2 grid place-items-center ${on ? 'bg-ink border-ink' : 'border-ink-4'}`}>
                      {on && <CheckIcon width={12} height={12} className="text-white" strokeWidth={3} />}
                    </span>
                    <span className="text-[15px]">{s.label}</span>
                  </button>
                )
              })}
            </div>
            <Button variant="dark" className="w-full h-14 mt-5" onClick={() => setStage('result')}>Check my FOMO</Button>
          </>
        )}

        {stage === 'result' && (
          <>
            <div className={`mt-6 rounded-3xl p-5 ${st.bg}`}>
              <div className="label !text-ink-2">FOMO Risk</div>
              <div className={`font-display text-[40px] font-bold leading-none mt-1 ${st.text}`}>{result.level}</div>
              <Meter score={result.score} color={st.bar} />
            </div>
            <div className="mt-5 label">Why</div>
            <ul className="mt-2 space-y-2">
              {result.reasons.map((r) => (
                <li key={r.text} className="flex gap-2.5 text-[15px]">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${r.tone === 'risk' ? 'bg-coral' : 'bg-mint'}`} />
                  {r.text}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl bg-ink text-white p-4 text-[15px] leading-relaxed">
              This doesn't mean you shouldn't invest.<br />
              <b>It means you should understand <i>why</i> you're investing.</b>
            </div>
            <div className="mt-5 space-y-2">
              <Button variant="dark" className="w-full" onClick={() => setStage('understand')}>Understand the investment</Button>
              <Button variant="ghost" className="w-full" onClick={() => setStage('continued')}>Continue anyway</Button>
            </div>
            <Disclaimer className="mt-4 text-center">
              FOMO Risk is a behavioural nudge based on your answers, not a prediction about the stock.
            </Disclaimer>
          </>
        )}

        {stage === 'understand' && (
          <>
            <h3 className="font-display text-[22px] font-semibold mt-6">What you'd actually be buying</h3>
            <p className="text-ink-2 mt-2 text-[15px] leading-relaxed">{a.about}</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Stat k="7-day move" v={`+${a.change7d}%`} />
              <Stat k="Volatility" v={a.volatility} />
              <Stat k="Profitable?" v="Not yet" />
            </div>
            <div className="card p-4 mt-4">
              <div className="label">Ask yourself</div>
              <ol className="mt-2 space-y-2 text-[15px] list-decimal pl-5 marker:text-ink-3">
                <li>Can I explain what this company does in one line?</li>
                <li>Would I hold it if it fell 30% next month?</li>
                <li>Is this money I won't need for 3+ years?</li>
              </ol>
            </div>
            <p className="mt-4 text-[14px] text-ink-2 leading-relaxed">
              If you still want in, consider keeping single stocks to a small slice of your investing money, and never your {goal?.name ?? 'goal'} money.
            </p>
            <div className="mt-5 space-y-2">
              <Button className="w-full" onClick={pause}>Sleep on it for 24h · +40 XP</Button>
              <Button variant="ghost" className="w-full" onClick={() => setStage('continued')}>Continue anyway</Button>
            </div>
          </>
        )}

        {stage === 'continued' && (
          <div className="text-center py-8">
            <div className="text-5xl">👍</div>
            <h3 className="font-display text-2xl font-semibold mt-4">Your call. That's how it should be.</h3>
            <p className="text-ink-2 mt-2 text-[15px]">You checked the why before buying, and that's the habit that matters.</p>
            <p className="text-[12px] text-ink-3 mt-4">Demo: in the real app this would open the order screen. No real trade is placed.</p>
            <Button variant="dark" className="w-full mt-6" onClick={close}>Done</Button>
          </div>
        )}

        {stage === 'paused' && (
          <div className="text-center py-8">
            <div className="text-5xl">🧘</div>
            <h3 className="font-display text-2xl font-semibold mt-4">Smart pause.</h3>
            <p className="text-ink-2 mt-2 text-[15px]">If it's a good investment today, it'll still be one tomorrow. Your {goal?.name ?? 'goal'} plan stays untouched.</p>
            <Button className="w-full mt-6" onClick={close}>Back to Invest</Button>
          </div>
        )}
      </div>
    </Sheet>
  )
}

function Meter({ score, color }: { score: number; color: string }) {
  return (
    <div className="mt-4">
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        <div className="flex-[35] bg-mint/30" /><div className="flex-[25] bg-amber/40" /><div className="flex-[40] bg-coral/35" />
      </div>
      <div className="relative h-0">
        <div className="absolute -top-[14px] w-1.5 h-[18px] rounded-full ring-2 ring-white transition-all duration-700" style={{ left: `calc(${score}% - 3px)`, background: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-ink-3 mt-2 font-semibold"><span>LOW</span><span>MEDIUM</span><span>HIGH</span></div>
    </div>
  )
}

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div className="rounded-2xl bg-paper-card border border-paper-line p-3">
    <div className="text-[11px] text-ink-3">{k}</div>
    <div className="font-semibold mt-0.5">{v}</div>
  </div>
)
