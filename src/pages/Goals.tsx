import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { useLayout } from '../lib/layout'
import { GOAL_TEMPLATES, goalFromTemplate, type GoalTemplate } from '../data/demo'
import { inr } from '../lib/format'
import { GoalCard } from '../components/Cards'
import { Button, Pill, SectionTitle, Sheet } from '../components/ui'

export default function Goals() {
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const { web } = useLayout()
  const { goals, activeGoalId } = state.user
  const focus = goals.find((g) => g.id === activeGoalId)
  const others = goals.filter((g) => g.id !== activeGoalId)
  const [adding, setAdding] = useState<GoalTemplate | null>(null)
  const [price, setPrice] = useState(0)
  const [name, setName] = useState('')

  const open = (t: GoalTemplate) => { setAdding(t); setPrice(t.price); setName(t.kind === 'custom' ? '' : t.name) }
  const add = () => {
    if (!adding) return
    const goal = goalFromTemplate(adding, { name: name.trim() || 'My goal', targetAmount: price })
    dispatch({ type: 'ADD_GOAL', goal })
    setAdding(null)
    nav(`/goals/${goal.id}`)
  }

  return (
    <div className={web ? "" : "px-5 pt-5"}>
      <h1 className={`font-display font-semibold tracking-tight ${web ? "text-[40px]" : "text-[30px]"}`}>Goals</h1>
      <p className="text-ink-3 mt-1">One focus at a time. Focus is how things actually happen.</p>

      {!focus && others.length === 0 && (
        <div className="card p-6 mt-6 text-center">
          <div className="text-4xl">🎯</div>
          <div className="font-display text-lg font-semibold mt-2">No goals yet</div>
          <p className="text-[14px] text-ink-3 mt-1">Pick something you want below. We'll turn it into a monthly number.</p>
        </div>
      )}

      {focus && (
        <>
          <div className="mt-6 mb-2 flex items-center gap-2"><Pill tone="mint">Focus goal</Pill></div>
          <div className={web ? "md:max-w-[calc(50%-8px)] xl:max-w-[calc(33.333%-11px)]" : ""}><GoalCard goal={focus} /></div>
        </>
      )}

      {others.length > 0 && (
        <>
          <SectionTitle>Also building</SectionTitle>
          <div className={web ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>{others.map((g) => <GoalCard key={g.id} goal={g} compact />)}</div>
        </>
      )}

      <SectionTitle>Add a goal</SectionTitle>
      <div className={web ? "grid grid-cols-4 xl:grid-cols-8 gap-3" : "grid grid-cols-4 gap-2"}>
        {GOAL_TEMPLATES.map((t) => (
          <button key={t.kind} onClick={() => open(t)} className="rounded-2xl bg-paper-card border border-paper-line py-3 px-1 text-center hover:shadow-card hover:-translate-y-0.5 transition">
            <div className="text-2xl">{t.emoji}</div>
            <div className="text-[11px] font-semibold mt-1.5 leading-tight text-ink-2">{t.name}</div>
          </button>
        ))}
      </div>

      <Sheet open={!!adding} onClose={() => setAdding(null)} title={adding && <>{adding.emoji} New goal</>}>
        {adding && (
          <div className="space-y-3">
            <label className="block card px-4 py-3">
              <div className="text-[13px] text-ink-3 mb-1">What is it?</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Concert tickets" className="w-full bg-transparent text-lg font-semibold outline-none" />
            </label>
            <label className="block card px-4 py-3">
              <div className="text-[13px] text-ink-3 mb-1">It costs about</div>
              <div className="flex items-center gap-1 text-lg font-semibold">
                <span className="text-ink-3">₹</span>
                <input inputMode="numeric" value={price ? price.toLocaleString('en-IN') : ''}
                  onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, '').slice(0, 9)) || 0)}
                  className="w-full bg-transparent outline-none num" />
              </div>
            </label>
            <Button className="w-full h-14 mt-2" onClick={add} disabled={price < 500}>See what {inr(price)} takes</Button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
