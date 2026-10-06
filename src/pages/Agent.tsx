import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp, useDerived } from '../state/store'
import { useHost } from '../integration/host'
import { useLayout } from '../lib/layout'
import { agentFollowUp, agentReply, SUGGESTED_PROMPTS, type AgentAction, type AgentContext, type AgentMessage } from '../lib/agent'
import { goalForItem } from '../data/demo'
import { AffordSheet, type AffordSeed } from '../components/AffordIt'
import { inr } from '../lib/format'
import { LessonSheet } from '../components/MoneyMinute'
import { PageHeader } from '../components/ui'
import { SendIcon, SparkIcon } from '../components/Icons'

const TONE_DOT = { goal: 'bg-mint', invest: 'bg-violet', flex: 'bg-ink/20', buffer: 'bg-amber', warn: 'bg-coral' }

export default function Agent() {
  const { state, dispatch } = useApp()
  const { user, goal, health } = useDerived()
  const nav = useNavigate()
  const { web } = useLayout()
  const host = useHost()
  const px = web ? "px-0" : "px-4"
  const [params] = useSearchParams()
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [used, setUsed] = useState<Set<string>>(new Set())
  const [lesson, setLesson] = useState<string | null>(null)
  const [afford, setAfford] = useState<AffordSeed | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const autoSent = useRef(false)

  const ctx: AgentContext = { user, movedThisMonth: state.movedThisMonth }

  const [messages, setMessages] = useState<AgentMessage[]>(() => [{
    id: 'intro', role: 'agent',
    text: `Hey ${user.name}. I know your ${goal?.name ?? 'goal'} plan, your ${inr(user.monthlyAvailable)} of monthly free money, and your Money Health (${health.total}).\n\nAsk me anything about your money. I'll keep it simple.`,
  }])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, typing])

  const agentSays = (m: AgentMessage | null) => {
    if (!m) return
    setTyping(true)
    setTimeout(() => { setTyping(false); setMessages((xs) => [...xs, m]) }, 650)
  }

  const send = (text: string) => {
    const t = text.trim()
    if (!t || typing) return
    setMessages((xs) => [...xs, { id: 'u' + Date.now(), role: 'user', text: t }])
    setInput('')
    agentSays(agentReply(t, ctx))
  }

  useEffect(() => {
    const q = params.get('q')
    if (q && !autoSent.current) { autoSent.current = true; send(q) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onAction = (msgId: string, a: AgentAction) => {
    const key = msgId + a.label
    if (used.has(key)) return
    setUsed((s) => new Set(s).add(key))
    switch (a.id) {
      case 'open_fomo': return nav('/invest?fomo=1')
      case 'open_health': return nav('/money')
      case 'open_goal': return goal && nav(`/goals/${goal.id}`)
      case 'open_returns': return nav('/invest?returns=1')
      case 'open_afford': return setAfford({ item: String(a.payload?.item ?? 'iPhone'), price: Number(a.payload?.price ?? 79900) })
      case 'open_lesson': return setLesson(String(a.payload?.lesson ?? 'sip'))
      case 'ask': return send(String(a.payload?.prompt ?? ''))
    }
    setMessages((xs) => [...xs, { id: 'u' + Date.now(), role: 'user', text: a.label }])
    if (a.id === 'apply_split') {
      // Monthly questions apply Home's exact move; one-off amounts land in the goal and buffer.
      if (a.payload?.monthly) dispatch({ type: 'MAKE_MOVE' })
      else dispatch({ type: 'APPLY_SPLIT', toGoal: Number(a.payload?.toGoal ?? 0), toBuffer: Number(a.payload?.toBuffer ?? 0), label: 'Put extra money to work' })
      host.trackEvent('dreams_agent_split_applied', { amount: Number(a.payload?.amount ?? 0), goal: Number(a.payload?.toGoal ?? 0), buffer: Number(a.payload?.toBuffer ?? 0) })
    }
    if (a.id === 'keep_plan') dispatch({ type: 'REWARD_ONCE', key: 'keep-plan', xp: 40, label: 'Stayed on plan, skipped an impulse EMI' })
    if (a.id === 'add_goal') dispatch({ type: 'ADD_GOAL', goal: goalForItem(String(a.payload?.item), Number(a.payload?.price)) })
    agentSays(agentFollowUp(a, ctx))
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        back
        title={
          <span className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-ink grid place-items-center"><SparkIcon width={17} height={17} className="text-mint" /></span>
            <span>
              <span className="block leading-tight">Money Agent</span>
              <span className="block text-[11px] font-sans font-medium text-ink-3">Coach, not a stock tipster · demo</span>
            </span>
          </span>
        }
      />

      <div className={web ? "flex-1 grid lg:grid-cols-[280px_minmax(0,1fr)] gap-8 items-start" : "flex flex-col flex-1"}>
      {web && <AgentSide send={send} goalName={goal?.name} health={health.total} monthly={user.monthlyAvailable} />}
      <div className="flex flex-col flex-1 min-w-0 self-stretch">
      <div className={`flex-1 ${px} pb-4 space-y-3`}>
        {messages.map((m) => (m.role === 'user' ? (
          <div key={m.id} className="flex justify-end animate-rise">
            <div className={`${web ? "max-w-[70%]" : "max-w-[80%]"} rounded-[20px] rounded-br-md bg-ink text-white px-4 py-2.5 text-[15px]`}>{m.text}</div>
          </div>
        ) : (
          <div key={m.id} className="flex animate-rise">
            <div className={`${web ? "max-w-[85%]" : "max-w-[90%]"} rounded-[20px] rounded-bl-md bg-paper-card border border-paper-line shadow-card px-4 py-3`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-line">{m.text}</p>
              {m.lines && (
                <div className="mt-3 rounded-2xl bg-paper p-3 space-y-2">
                  {m.lines.map((l) => (
                    <div key={l.label} className="flex items-center gap-2.5 text-[15px]">
                      <span className={`w-2.5 h-2.5 rounded-full ${TONE_DOT[l.tone]}`} />
                      <span className="font-display font-semibold num w-[64px]">{inr(l.amount)}</span>
                      <span className="text-ink-3">→</span>
                      <span>{l.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {m.note && <p className="text-[13px] text-ink-3 mt-3 leading-snug">{m.note}</p>}
              {m.basis && m.basis.length > 0 && <p className="text-[11.5px] text-ink-3 mt-2 leading-snug">Based on: {m.basis.join(' · ')}</p>}
              {m.actions && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {m.actions.map((a) => {
                    const done = used.has(m.id + a.label)
                    return (
                      <button key={a.id + a.label} onClick={() => onAction(m.id, a)} disabled={done}
                        className={`tap h-9 px-3.5 rounded-full text-[13px] font-semibold transition disabled:opacity-40 ${a.primary ? 'bg-mint text-white hover:bg-mint-dark' : 'bg-ink/[0.06] hover:bg-ink/10'}`}>
                        {a.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )))}
        {typing && (
          <div className="flex">
            <div className="rounded-[20px] rounded-bl-md bg-paper-card border border-paper-line px-4 py-3.5 flex gap-1">
              {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className={`sticky bottom-0 bg-paper pt-2.5 ${web ? "pb-4" : "border-t border-paper-line pb-safe"}`}>
        <div className={`flex gap-2 overflow-x-auto no-scrollbar ${px} pb-2.5 ${web ? "lg:hidden" : ""}`}>
          {SUGGESTED_PROMPTS.map((p) => (
            <button key={p} onClick={() => send(p)} className="tap shrink-0 h-8 px-3 rounded-full bg-paper-card border border-paper-line text-[12.5px] font-medium text-ink-2 hover:border-ink/20">
              {p}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input) }} className={`${px} flex gap-2`}>
          <input
            value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your money…"
            className="flex-1 h-12 rounded-2xl bg-paper-card border border-paper-line px-4 text-[15px] outline-none focus:border-ink/30"
          />
          <button type="submit" disabled={!input.trim() || typing} className="w-12 h-12 rounded-2xl bg-ink text-white grid place-items-center disabled:opacity-30" aria-label="Send">
            <SendIcon width={20} height={20} />
          </button>
        </form>
        <p className="text-[10.5px] text-ink-3 text-center mt-2">Rule-based demo coach. Not investment advice.</p>
      </div>

      </div>
      </div>

      <LessonSheet lessonId={lesson} onClose={() => setLesson(null)} />
      {afford && <AffordSheet key={afford.item + afford.price} open seed={afford} onClose={() => setAfford(null)} />}
    </div>
  )
}

/** Web-only left rail: who the agent is, what it knows, and one-click prompts. */
function AgentSide({ send, goalName, health, monthly }: { send: (t: string) => void; goalName?: string; health: number; monthly: number }) {
  return (
    <aside className="hidden lg:block lg:sticky lg:top-0 space-y-4">
      <div className="card p-5">
        <div className="label">What I know</div>
        <dl className="mt-3 space-y-2.5 text-[14px]">
          <div className="flex justify-between"><dt className="text-ink-3">Focus goal</dt><dd className="font-semibold">{goalName ?? 'None yet'}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-3">Free money</dt><dd className="font-semibold num">{inr(monthly)}/mo</dd></div>
          <div className="flex justify-between"><dt className="text-ink-3">Money Health</dt><dd className="font-semibold num">{health}</dd></div>
        </dl>
      </div>
      <div>
        <div className="label mb-2.5">Try asking</div>
        <div className="flex flex-col gap-2">
          {SUGGESTED_PROMPTS.map((p) => (
            <button key={p} onClick={() => send(p)} className="text-left text-[13.5px] font-medium text-ink-2 rounded-2xl bg-paper-card border border-paper-line px-3.5 py-2.5 hover:border-ink/25 hover:shadow-card transition">
              {p}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
