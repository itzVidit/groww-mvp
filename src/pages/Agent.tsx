import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp, useDerived } from '../state/store'
import { agentFollowUp, agentReply, SUGGESTED_PROMPTS, type AgentAction, type AgentContext, type AgentMessage } from '../lib/agent'
import { goalFromTemplate, templateFor } from '../data/demo'
import { inr } from '../lib/format'
import { LessonSheet } from '../components/MoneyMinute'
import { PageHeader } from '../components/ui'
import { SendIcon, SparkIcon } from '../components/Icons'

const TONE_DOT = { goal: 'bg-mint', invest: 'bg-violet', flex: 'bg-ink/20', buffer: 'bg-amber', warn: 'bg-coral' }

export default function Agent() {
  const { state, dispatch } = useApp()
  const { user, goal, health } = useDerived()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [used, setUsed] = useState<Set<string>>(new Set())
  const [lesson, setLesson] = useState<string | null>(null)
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
      case 'open_lesson': return setLesson(String(a.payload?.lesson ?? 'sip'))
      case 'ask': return send(String(a.payload?.prompt ?? ''))
    }
    setMessages((xs) => [...xs, { id: 'u' + Date.now(), role: 'user', text: a.label }])
    if (a.id === 'apply_split') dispatch({ type: 'ADD_TO_GOAL', amount: Number(a.payload?.toGoal ?? 0), label: 'Put extra money to work' })
    if (a.id === 'keep_plan') dispatch({ type: 'REWARD_ONCE', key: 'keep-plan', xp: 40, label: 'Stayed on plan, skipped an impulse EMI' })
    if (a.id === 'add_goal') {
      const item = String(a.payload?.item)
      const t = templateFor(item === 'iPhone' ? 'iphone' : item === 'bike' ? 'bike' : 'custom')
      dispatch({ type: 'ADD_GOAL', goal: goalFromTemplate(t, { name: item === 'this' ? 'Next purchase' : item.replace(/^\w/, (c) => c.toUpperCase()), targetAmount: Number(a.payload?.price) }) })
    }
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

      <div className="flex-1 px-4 pb-4 space-y-3">
        {messages.map((m) => (m.role === 'user' ? (
          <div key={m.id} className="flex justify-end animate-rise">
            <div className="max-w-[80%] rounded-[20px] rounded-br-md bg-ink text-white px-4 py-2.5 text-[15px]">{m.text}</div>
          </div>
        ) : (
          <div key={m.id} className="flex animate-rise">
            <div className="max-w-[90%] rounded-[20px] rounded-bl-md bg-paper-card border border-paper-line shadow-card px-4 py-3">
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
              {m.actions && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {m.actions.map((a) => {
                    const done = used.has(m.id + a.label)
                    return (
                      <button key={a.id + a.label} onClick={() => onAction(m.id, a)} disabled={done}
                        className={`h-9 px-3.5 rounded-full text-[13px] font-semibold transition disabled:opacity-40 ${a.primary ? 'bg-mint text-white hover:bg-mint-dark' : 'bg-ink/[0.06] hover:bg-ink/10'}`}>
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
      <div className="sticky bottom-0 bg-paper border-t border-paper-line pt-2.5 pb-safe">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2.5">
          {SUGGESTED_PROMPTS.map((p) => (
            <button key={p} onClick={() => send(p)} className="shrink-0 h-8 px-3 rounded-full bg-paper-card border border-paper-line text-[12.5px] font-medium text-ink-2 hover:border-ink/20">
              {p}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="px-4 flex gap-2">
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

      <LessonSheet lessonId={lesson} onClose={() => setLesson(null)} />
    </div>
  )
}
