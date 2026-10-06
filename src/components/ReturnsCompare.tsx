import { HISTORIC_RETURNS, RETURNS_DISCLAIMER, midpoint, rangeLabel, type HistoricReturn } from '../data/returns'
import { Disclaimer, Pill } from './ui'

const RISK_TONE = { Low: 'mint', Medium: 'amber', High: 'coral' } as const
const SCALE_MAX = 15 // % per year, so every bar shares one scale

/** Past returns side by side: one scale, the range, the risk, and what it's good for. */
export function ReturnsCompare() {
  const rows = [...HISTORIC_RETURNS].sort((a, b) => midpoint(b) - midpoint(a))
  return (
    <section id="returns" aria-labelledby="returns-title">
      <h2 id="returns-title" className="font-display text-[17px] font-semibold tracking-tight">What these have returned, per year</h2>
      <p className="text-[13px] text-ink-3 mt-0.5 mb-3">Past, not promised. Higher past returns came with bigger swings.</p>
      <div className="card divide-y divide-paper-line">
        {rows.map((r) => <ReturnRow key={r.id} r={r} />)}
      </div>
      <Disclaimer className="mt-3">{RETURNS_DISCLAIMER}</Disclaimer>
    </section>
  )
}

function ReturnRow({ r }: { r: HistoricReturn }) {
  const mid = midpoint(r)
  return (
    <details className="group p-4">
      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-paper grid place-items-center text-xl shrink-0">{r.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] leading-tight">{r.name}</div>
            <div className="mt-1 flex items-center gap-2">
              <Pill tone={RISK_TONE[r.risk]} className="!py-0 !text-[10px]">Risk: {r.risk}</Pill>
              <span className="text-[11px] text-ink-3">{r.kind}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-lg font-semibold num text-mint-dark">{rangeLabel(r)}</div>
            <div className="text-[11px] text-ink-3">per year</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-ink/[0.07] overflow-hidden" role="img" aria-label={`${r.name}: about ${mid} percent a year in the past`}>
          <div className="h-full rounded-full bg-mint" style={{ width: `${Math.min(100, (mid / SCALE_MAX) * 100)}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.periods.map((p) => (
            <span key={p.k} className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11.5px] text-ink-2"><span className="text-ink-3">{p.k}</span> <b className="num">{p.v}</b></span>
          ))}
        </div>
        <span className="mt-2 block text-[12px] font-semibold text-ink-3 group-open:hidden">What to know</span>
      </summary>
      <div className="mt-3 text-[13.5px] text-ink-2 leading-relaxed space-y-2">
        <p>{r.note}</p>
        <p><b>Fits:</b> {r.fit}</p>
        <p className="text-[11.5px] text-ink-3">As of {r.asOf}. Source: {r.source}.</p>
      </div>
    </details>
  )
}
