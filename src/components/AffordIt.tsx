import { useMemo, useState } from 'react'
import { useApp, useDerived } from '../state/store'
import { useHost } from '../integration/host'
import { computeAfford, DEFAULT_PRICES, EMI_MONTHS, type AffordOption } from '../lib/afford'
import { goalForItem } from '../data/demo'
import { inr } from '../lib/format'
import { Button, Disclaimer, Pill, Sheet } from './ui'

export interface AffordSeed { item: string; price: number }

const CHIPS = Object.entries(DEFAULT_PRICES)

/** "Can I afford it?": Buy now (EMI) vs Build first vs Invest + wait, and what each costs the rest of your money. */
export function AffordSheet({ open, onClose, seed }: { open: boolean; onClose: () => void; seed?: AffordSeed }) {
  const { dispatch } = useApp()
  const { user, goal } = useDerived()
  const host = useHost()
  const [item, setItem] = useState(seed?.item && seed.item !== 'this' ? seed.item : 'iPhone')
  const [price, setPrice] = useState(String(seed?.price ?? DEFAULT_PRICES.iPhone))
  const [months, setMonths] = useState<number>(12)
  const [armed, setArmed] = useState(false)

  const amount = Math.max(0, Math.round(Number(price.replace(/[^\d]/g, '')) || 0))
  const result = useMemo(() => computeAfford(user, amount, months), [user, amount, months])
  const [buy, build, wait] = result.options
  const goalName = goal?.name ?? 'goal'
  const label = item.trim() || 'it'

  const close = () => { setArmed(false); onClose() }
  const pickChip = (name: string, p: number) => { setItem(name); setPrice(String(p)); setArmed(false) }

  const rows: { k: string; v: (o: AffordOption) => string; warn?: (o: AffordOption) => boolean }[] = [
    { k: 'Monthly cash for it', v: (o) => (o.monthlyToItem > 0 ? `${inr(o.monthlyToItem)}/mo` : '₹0 for now') },
    { k: `${goalName} ready by`, v: (o) => o.goalDate, warn: (o) => o.goalDate !== build.goalDate },
    { k: 'Investing', v: (o) => `${inr(o.investing)}/mo`, warn: (o) => o.investing < user.monthlyInvestment },
    { k: 'Emergency buffer', v: (o) => (o.buffer > 0 ? `${inr(o.buffer)}/mo` : 'No room') },
    { k: 'You own it', v: (o) => o.ownDate },
    { k: 'EMI vs free money', v: (o) => (o.emiShare === null ? 'No EMI' : `${o.emiShare}%`), warn: (o) => (o.emiShare ?? 0) >= 50 },
  ]

  const addGoal = () => {
    dispatch({ type: 'ADD_GOAL', goal: goalForItem(item, amount) })
    host.trackEvent('dreams_afford_add_goal', { item, price: amount })
    close()
  }
  const keepPlan = () => {
    dispatch({ type: 'REWARD_ONCE', key: 'keep-plan', xp: 40, label: 'Stayed on plan, skipped an impulse EMI' })
    host.trackEvent('dreams_afford_keep_plan', { item, price: amount })
    close()
  }
  const confirmEmi = () => {
    if (!armed) return setArmed(true)
    dispatch({ type: 'START_EMI', item: label, monthly: result.emi, months })
    host.trackEvent('dreams_afford_emi_confirmed', { item, price: amount, emi: result.emi, months })
    close()
  }

  return (
    <Sheet open={open} onClose={close} tall title="Can I afford it?">
      <p className="text-ink-2 text-[14px] leading-relaxed">Three ways to get it, and what each one costs the rest of your money.</p>

      <div className="mt-4 flex gap-2 flex-wrap">
        {CHIPS.map(([name, p]) => (
          <button key={name} onClick={() => pickChip(name, p)}
            aria-pressed={item === name && amount === p} className={`tap h-8 px-3 rounded-full text-[13px] font-semibold border transition ${item === name && amount === p ? 'bg-ink text-white border-ink' : 'bg-paper-card border-paper-line text-ink-2'}`}>
            {name}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide">Item</span>
          <input value={item} onChange={(e) => { setItem(e.target.value); setArmed(false) }} className="mt-1 w-full h-11 rounded-xl bg-paper-card border border-paper-line px-3 text-[15px] outline-none focus:border-ink/30" />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide">Price (₹)</span>
          <input value={price} inputMode="numeric" onChange={(e) => { setPrice(e.target.value); setArmed(false) }} className="mt-1 w-full h-11 rounded-xl bg-paper-card border border-paper-line px-3 text-[15px] num outline-none focus:border-ink/30" />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[12px] text-ink-3 mr-1">EMI months</span>
        {EMI_MONTHS.map((m) => (
          <button key={m} onClick={() => { setMonths(m); setArmed(false) }}
            aria-pressed={months === m} className={`tap h-8 px-3 rounded-full text-[13px] font-semibold border transition ${months === m ? 'bg-ink text-white border-ink' : 'bg-paper-card border-paper-line text-ink-2'}`}>{m}</button>
        ))}
      </div>

      {amount > 0 ? (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {result.options.map((o) => (
              <div key={o.id} className="rounded-2xl bg-paper-card border border-paper-line p-2.5">
                <div className="text-[13px] font-bold leading-tight">{o.title}</div>
                <div className="text-[11px] text-ink-3 mt-1 leading-snug">{o.tagline}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 card divide-y divide-paper-line">
            {rows.map((r) => (
              <div key={r.k} className="px-3 py-2.5">
                <div className="text-[11px] text-ink-3 font-semibold">{r.k}</div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {result.options.map((o) => (
                    <div key={o.id} className={`text-[13px] font-semibold num ${r.warn?.(o) ? 'text-coral' : 'text-ink'}`}>{r.v(o)}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-ink-2 leading-relaxed">
            {buy.emiShare! >= 50
              ? `The EMI (${inr(result.emi)}/month) would take ${buy.emiShare}% of your free money, so ${goalName} and investing both slow down.`
              : `The EMI (${inr(result.emi)}/month) is ${buy.emiShare}% of your free money. Doable, with less room for surprises.`}{' '}
            {wait.note}
          </p>
        </>
      ) : (
        <p className="mt-5 text-[14px] text-ink-3">Enter a price to compare.</p>
      )}

      <div className="mt-5 space-y-2">
        <Button className="w-full" disabled={amount <= 0} onClick={addGoal}>Build first: add {label} as next goal</Button>
        <Button variant="dark" className="w-full" onClick={keepPlan}>Keep my current plan · +40 XP</Button>
        {!user.emi && amount > 0 && (
          <Button variant="ghost" className="w-full" onClick={confirmEmi}>
            {armed ? `Confirm: ${inr(result.emi)}/mo for ${months} months` : 'Buy now on EMI anyway'}
          </Button>
        )}
        {user.emi && <Pill tone="amber">You already have a {user.emi.item} EMI running ({user.emi.monthsLeft} months left)</Pill>}
      </div>
      {armed && <p className="text-[12px] text-ink-3 mt-2 text-center">This adds the EMI to your monthly move and counts against your Credit score. Simulated.</p>}
      <details className="mt-4 text-[12.5px] text-ink-2 group">
        <summary className="cursor-pointer font-semibold list-none [&::-webkit-details-marker]:hidden">
          How we calculated this <span className="text-ink-3 group-open:hidden">(show)</span>
        </summary>
        <ul className="mt-2 space-y-1.5 list-disc pl-5 marker:text-ink-3 leading-relaxed">
          <li>EMI = price ÷ months, with no interest (a "no-cost" EMI).</li>
          <li>Buy now: the EMI comes off your free money first. The goal gets what's left, then investing, then the buffer.</li>
          <li>Build first: finish the goal, then save (free money − your usual investing) each month.</li>
          <li>Invest + wait: half of that goes to the item, half to investing.</li>
          <li>No option assumes any investment returns.</li>
        </ul>
      </details>
      <Disclaimer className="mt-4 text-center">Illustrative. Assumes a no-cost EMI and no returns on money you save. Not financial advice.</Disclaimer>
    </Sheet>
  )
}
