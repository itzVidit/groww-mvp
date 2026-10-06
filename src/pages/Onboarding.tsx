import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { DEMO_GOAL, DEMO_USER, GOAL_TEMPLATES, goalFromTemplate, templateFor } from '../data/demo'
import type { Experience, Risk, User } from '../types'
import { Button } from '../components/ui'
import { Logo } from '../components/Layout'
import { useLayout } from '../lib/layout'
import { BackIcon } from '../components/Icons'

const STEPS = 5

const PERKS = [
  { emoji: "🎯", title: "Goal-first plans", sub: "Pick a PS5, a trip or a bike. See the monthly math." },
  { emoji: "🛡️", title: "FOMO Shield", sub: "Pause before the hype trade. Earn XP for it." },
  { emoji: "💬", title: "A coach, not a tipster", sub: "Ask the Money Agent anything, in plain words." },
]

export default function Onboarding() {
  const { dispatch } = useApp()
  const nav = useNavigate()
  const { web } = useLayout()
  const [step, setStep] = useState(0)
  const [building, setBuilding] = useState(false)

  const [kind, setKind] = useState<string>('ps5')
  const [goalName, setGoalName] = useState('PS5')
  const [price, setPrice] = useState(DEMO_GOAL.targetAmount)
  const [saved, setSaved] = useState(DEMO_GOAL.currentAmount)
  const [months, setMonths] = useState(DEMO_GOAL.targetMonths)

  const [name, setName] = useState(DEMO_USER.name)
  const [age, setAge] = useState(DEMO_USER.age)
  const [income, setIncome] = useState(DEMO_USER.income)
  const [available, setAvailable] = useState(DEMO_USER.monthlyAvailable)
  const [savings, setSavings] = useState(DEMO_USER.savings)
  const [experience, setExperience] = useState<Experience>(DEMO_USER.experience)
  const [investing, setInvesting] = useState(DEMO_USER.monthlyInvestment)
  const [risk, setRisk] = useState<Risk>(DEMO_USER.risk)

  const pickGoal = (k: string) => {
    const t = templateFor(k)
    setKind(k)
    setGoalName(k === 'custom' ? '' : t.name)
    setPrice(t.price)
    setSaved(k === 'ps5' ? DEMO_GOAL.currentAmount : 0)
    setMonths(t.months)
    setStep(1)
  }

  const finish = (u?: User) => {
    const template = templateFor(kind)
    const user: User =
      u ?? {
        ...DEMO_USER,
        name: name.trim() || 'there',
        age,
        income: Math.max(1000, income),
        monthlyAvailable: Math.min(Math.max(500, available), Math.max(1000, income)),
        savings,
        monthlyInvestment: Math.min(investing, available),
        experience,
        risk,
        goals: [goalFromTemplate(template, {
          ...(kind === 'ps5' ? { id: 'ps5' } : {}),
          name: goalName.trim() || 'My goal',
          targetAmount: Math.max(1000, price),
          currentAmount: Math.min(saved, price),
          targetMonths: months,
        })],
      }
    if (!u) user.activeGoalId = user.goals[0].id
    setBuilding(true)
    setTimeout(() => {
      dispatch({ type: 'COMPLETE_ONBOARDING', user })
      nav(`/goals/${user.activeGoalId}`, { replace: true })
    }, 1300)
  }

  const useDemo = () => finish(structuredClone(DEMO_USER))

  if (building) return <Building name={name} goal={goalName || 'goal'} />

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish())
  const emoji = templateFor(kind).emoji

  const flow = (
    <div className="flex flex-col flex-1 min-h-full">
      {/* Top bar */}
      <div className="px-5 pt-5 flex items-center gap-3 h-14">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="-ml-2 w-9 h-9 grid place-items-center rounded-full hover:bg-ink/5" aria-label="Back">
            <BackIcon />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-mint grid place-items-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l5-5 4 4 6-7" /></svg>
            </div>
            <span className="font-display font-semibold">Groww Dreams</span>
          </div>
        )}
        <div className="flex-1 flex gap-1.5 justify-end">
          {Array.from({ length: STEPS }).map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-ink' : i < step ? 'w-1.5 bg-ink' : 'w-1.5 bg-ink/15'}`} />
          ))}
        </div>
      </div>

      <div key={step} className="flex-1 px-5 pt-4 pb-6 flex flex-col animate-rise">
        {step === 0 && (
          <>
            <h1 className="font-display text-[34px] leading-[1.05] font-semibold tracking-tight">What are you<br />building toward?</h1>
            <p className="text-ink-2 mt-3">Start with what you want. We'll figure out the money part together.</p>
            <div className="grid grid-cols-2 gap-2.5 mt-6">
              {GOAL_TEMPLATES.map((t, i) => (
                <button
                  key={t.kind} onClick={() => pickGoal(t.kind)}
                  style={{ animationDelay: `${i * 35}ms` }}
                  className={`animate-rise text-left rounded-2xl p-3.5 border-2 bg-paper-card transition hover:-translate-y-0.5 hover:shadow-card ${t.kind === 'ps5' ? 'border-mint/50' : 'border-transparent'}`}
                >
                  <div className="text-[28px] leading-none">{t.emoji}</div>
                  <div className="font-semibold mt-2.5 text-[15px]">{t.name}</div>
                  <div className="text-[12px] text-ink-3 mt-0.5">{t.blurb}</div>
                </button>
              ))}
            </div>
            <button onClick={useDemo} className="mt-6 mx-auto text-sm font-semibold text-ink-3 hover:text-ink underline underline-offset-4">
              Skip. Use Vidit's demo profile
            </button>
          </>
        )}

        {step === 1 && (
          <Step
            title={<>{emoji} {kind === 'custom' ? "What's the dream?" : <>Let's size up your {goalName}.</>}</>}
            sub="Rough numbers are fine. You can change them anytime."
          >
            {kind === 'custom' && (
              <Field label="Name it">
                <input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="e.g. Concert tickets"
                  className="w-full bg-transparent text-xl font-semibold outline-none placeholder:text-ink-4" autoFocus />
              </Field>
            )}
            <Field label="It costs about"><MoneyInput value={price} onChange={setPrice} /></Field>
            <Field label="Already saved for it"><MoneyInput value={saved} onChange={setSaved} /></Field>
            <Field label="I want it in">
              <Chips value={months} onChange={setMonths} options={[3, 4, 6, 12, 24].map((m) => ({ value: m, label: `${m} months` }))} />
            </Field>
          </Step>
        )}

        {step === 2 && (
          <Step title="Quick intro." sub="So the plan sounds like you, not a bank.">
            <Field label="Call me">
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-xl font-semibold outline-none" />
            </Field>
            <Field label="Age">
              <Chips value={age} onChange={setAge} options={[19, 20, 21, 22, 23, 24, 25, 26].map((a) => ({ value: a, label: String(a) }))} />
            </Field>
          </Step>
        )}

        {step === 3 && (
          <Step title="Your monthly money." sub="Just ballparks. No bank login, no judgement.">
            <Field label="Monthly income (salary, stipend, side gigs)"><MoneyInput value={income} onChange={setIncome} /></Field>
            <Field label="Left after rent, food & bills" hint={`That's ${Math.round((available / Math.max(1, income)) * 100)}% of your income, free each month.`}>
              <MoneyInput value={available} onChange={setAvailable} />
            </Field>
            <Field label="Savings you already have (not for this goal)"><MoneyInput value={savings} onChange={setSavings} /></Field>
          </Step>
        )}

        {step === 4 && (
          <Step title="Last one: investing." sub="There are no wrong answers here.">
            <Field label="Have you invested before?">
              <Options value={experience} onChange={setExperience} options={[
                { value: 'none', label: 'Not yet', sub: 'Curious, but never started' },
                { value: 'some', label: 'A little', sub: 'An SIP or a few stocks' },
                { value: 'regular', label: 'Regularly', sub: 'I know my way around' },
              ]} />
            </Field>
            <Field label="Monthly investing right now"><MoneyInput value={investing} onChange={setInvesting} /></Field>
            <Field label="If ₹10,000 you invested became ₹8,000 for a few months, you'd…">
              <Options value={risk} onChange={setRisk} options={[
                { value: 'low', label: 'Panic & sell', sub: "I'd rather not see my money drop" },
                { value: 'medium', label: 'Feel uneasy, but wait', sub: 'Dips are part of it' },
                { value: 'high', label: 'Buy more', sub: 'Sale season' },
              ]} />
            </Field>
          </Step>
        )}

        {step > 0 && (
          <div className="mt-auto pt-6">
            <Button className="w-full h-14 text-base" onClick={next} disabled={step === 1 && price <= 0}>
              {step === STEPS - 1 ? 'Build my plan' : 'Continue'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  if (!web) return flow
  return (
    <div className="shrink-0 min-h-full grid lg:grid-cols-[5fr_6fr]">
      <aside className="hidden lg:flex flex-col justify-between bg-ink text-white p-12 xl:p-16 lg:sticky lg:top-0 lg:h-[100dvh] self-start">
        <Logo />
        <div>
          <h1 className="font-display text-[48px] leading-[1.02] font-semibold tracking-tight">Turn what you want today into wealth for tomorrow.</h1>
          <p className="mt-5 text-white/60 text-[17px] leading-relaxed max-w-[460px]">Start from the thing you want. We will show you exactly what your money needs to do, and keep you honest along the way.</p>
          <ul className="mt-10 space-y-4">
            {PERKS.map((p) => (
              <li key={p.title} className="flex gap-4 items-start">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-white/10 grid place-items-center text-lg">{p.emoji}</span>
                <div><div className="font-semibold">{p.title}</div><div className="text-[14px] text-white/50 mt-0.5">{p.sub}</div></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11.5px] text-white/35 leading-relaxed max-w-[460px]">Product concept. All data is mock and stored only in this browser. Not affiliated with or endorsed by Groww. Not investment advice.</p>
      </aside>
      <div className="flex flex-col min-h-full">
        <div className="w-full max-w-[520px] mx-auto flex-1 flex flex-col px-2 lg:py-6">{flow}</div>
      </div>
    </div>
  )
}

function Step({ title, sub, children }: { title: ReactNode; sub: string; children: ReactNode }) {
  return (
    <>
      <h1 className="font-display text-[28px] leading-tight font-semibold tracking-tight">{title}</h1>
      <p className="text-ink-2 mt-2">{sub}</p>
      <div className="mt-6 space-y-3">{children}</div>
    </>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block card px-4 py-3.5">
      <div className="text-[13px] text-ink-3 font-medium mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[12px] text-mint-dark mt-1.5 font-medium">{hint}</div>}
    </label>
  )
}

function MoneyInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1 text-xl font-semibold">
      <span className="text-ink-3">₹</span>
      <input
        inputMode="numeric"
        value={value ? value.toLocaleString('en-IN') : ''}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '').slice(0, 9)) || 0)}
        className="w-full bg-transparent outline-none num placeholder:text-ink-4"
      />
    </div>
  )
}

function Chips<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button" key={String(o.value)} onClick={() => onChange(o.value)}
          className={`px-3.5 h-9 rounded-full text-sm font-semibold transition ${o.value === value ? 'bg-ink text-white' : 'bg-ink/[0.05] text-ink-2 hover:bg-ink/10'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Options<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; sub: string }[] }) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <button
          type="button" key={o.value} onClick={() => onChange(o.value)}
          className={`w-full text-left rounded-xl px-3.5 py-2.5 border-2 transition ${o.value === value ? 'border-mint bg-mint-soft/60' : 'border-paper-line hover:border-ink/15'}`}
        >
          <div className="font-semibold text-[15px]">{o.label}</div>
          <div className="text-[12.5px] text-ink-3">{o.sub}</div>
        </button>
      ))}
    </div>
  )
}

function Building({ name, goal }: { name: string; goal: string }) {
  return (
    <div className="flex-1 grid place-items-center px-8 text-center animate-fade">
      <div>
        <div className="mx-auto w-14 h-14 rounded-full border-4 border-mint/20 border-t-mint animate-spin" />
        <h2 className="font-display text-2xl font-semibold mt-6">Mapping your {goal} to money, {name.split(' ')[0] || 'friend'}…</h2>
        <p className="text-ink-3 mt-2 text-sm">Working out what every rupee needs to do.</p>
      </div>
    </div>
  )
}
