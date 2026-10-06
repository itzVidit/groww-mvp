import type { User } from '../types.ts'
import { inr, monthLabel, parseAmount, pct, roundTo, roundUp } from './format.ts'
import { computeHealth, healthLabel, PILLARS, topPriority } from './health.ts'
import { activePlan, remainingFor } from './plan.ts'

/**
 * Money Agent: a rule-based coach. No LLM: it matches intent with keywords
 * and builds replies from the user's live numbers. It never picks stocks and
 * never promises returns.
 */

export type AgentActionId =
  | 'apply_split' | 'explain_split' | 'emi_compare' | 'keep_plan' | 'add_goal'
  | 'open_fomo' | 'open_health' | 'open_lesson' | 'open_goal' | 'ask'

export interface AgentAction {
  id: AgentActionId
  label: string
  primary?: boolean
  payload?: Record<string, string | number>
}

export interface AgentLine {
  label: string
  amount: number
  tone: 'goal' | 'invest' | 'flex' | 'buffer' | 'warn'
}

export interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  lines?: AgentLine[]
  note?: string
  actions?: AgentAction[]
}

export interface AgentContext {
  user: User
  movedThisMonth: boolean
}

let seq = 0
const msg = (m: Omit<AgentMessage, 'id' | 'role'>): AgentMessage => ({ id: 'a' + Date.now() + '-' + seq++, role: 'agent', ...m })

export const SUGGESTED_PROMPTS = [
  'I have ₹5,000 left this month',
  'Should I buy this iPhone on EMI?',
  "Everyone's buying VoltEdge. Should I?",
  'How am I doing?',
  "What's an SIP?",
]

const has = (t: string, words: string[]) => words.some((w) => t.includes(w))

function ctxBits(ctx: AgentContext) {
  const { user } = ctx
  const goal = user.goals.find((g) => g.id === user.activeGoalId)
  const plan = activePlan(goal, user)
  return { user, goal, plan, health: computeHealth(user) }
}

export function agentReply(input: string, ctx: AgentContext): AgentMessage {
  const t = input.toLowerCase()
  const amount = parseAmount(input)

  if (has(t, ['guarantee', 'sure shot', 'sure-shot', 'double my', 'doubles', '100%', 'risk free', 'risk-free', 'get rich']))
    return safetyReply()
  if (has(t, ['stock', 'crypto', 'trending', 'voltedge', 'tips', 'everyone', 'multibagger', 'share price', 'bitcoin', 'f&o']))
    return fomoReply()
  if (has(t, ['emi', 'buy', 'afford', 'iphone', 'purchase', 'laptop', 'credit card', 'loan']))
    return purchaseReply(t, amount, ctx)
  if (amount && has(t, ['left', 'extra', 'spare', 'bonus', 'have', 'got', 'surplus', 'saved', 'do with']))
    return splitReply(amount, ctx)
  if (has(t, ['what should i do', 'this month', 'my money']))
    return splitReply(ctx.user.monthlyAvailable, ctx, true)
  if (has(t, ['health', 'doing', 'score', 'progress', 'on track']))
    return healthReply(ctx)
  if (has(t, ['sip', ' fd', 'fd ', 'fixed deposit', 'compound', 'diversif', 'fall', 'crash', 'what is', "what's", 'explain', 'mutual fund', 'index']))
    return learnReply(t)
  if (has(t, ['goal', 'ps5', 'when', 'how long']))
    return goalReply(ctx)
  if (has(t, ['salary', 'budget', 'income']))
    return splitReply(ctx.user.monthlyAvailable, ctx, true)
  return fallbackReply()
}

/* ----------------------------- intents ----------------------------- */

export function splitAmounts(x: number) {
  const toGoal = roundTo(x * 0.3, 100)
  const toInvest = roundTo(x * 0.2, 100)
  return { toGoal, toInvest, flexible: x - toGoal - toInvest }
}

function splitReply(x: number, ctx: AgentContext, isMonthly = false): AgentMessage {
  const { goal, plan } = ctxBits(ctx)
  const name = goal?.name ?? 'goal'
  const s = splitAmounts(x)
  let opener: string
  if (isMonthly) opener = `You have about ${inr(x)} free this month after essentials.`
  else if (!goal?.plan) opener = `You haven't locked a plan for your ${name} yet, but here's a balanced way to use ${inr(x)}.`
  else if (ctx.movedThisMonth) opener = `You're ahead of your ${name} goal: this month's move is already done.`
  else opener = `Your ${name} goal is on track once you make this month's ${inr(plan!.toGoal)} move.`

  return msg({
    text: `${opener}\n\nA balanced move with ${inr(x)} could be:`,
    lines: [
      { label: name, amount: s.toGoal, tone: 'goal' },
      { label: 'Long-term investing', amount: s.toInvest, tone: 'invest' },
      { label: 'Flexible spending', amount: s.flexible, tone: 'flex' },
    ],
    note: 'This keeps your goal on track without putting your entire surplus into one goal.',
    actions: [
      { id: 'apply_split', label: 'Use this plan', primary: true, payload: { amount: x, toGoal: s.toGoal } },
      { id: 'explain_split', label: 'Explain why', payload: { amount: x } },
    ],
  })
}

function purchaseReply(t: string, amount: number | null, ctx: AgentContext): AgentMessage {
  const { user, goal, plan } = ctxBits(ctx)
  const item = t.includes('iphone') ? 'iPhone' : t.includes('laptop') ? 'laptop' : t.includes('bike') ? 'bike' : 'this'
  const price = amount ?? (item === 'iPhone' ? 79_900 : item === 'laptop' ? 70_000 : item === 'bike' ? 1_20_000 : 50_000)
  const emi = roundUp(price / 12, 10)
  const share = Math.round((emi / user.monthlyAvailable) * 100)
  const goalName = goal?.name ?? 'goal'

  let text: string
  if (share >= 50)
    text = `You can afford the EMI (about ${inr(emi)}/month for 12 months), but it would take ${share}% of the ${inr(user.monthlyAvailable)} you have free each month.\n\nYour ${goalName} plan and most of your investing would have to pause for a year. Waiting could keep your investment plan intact.`
  else if (share >= 25)
    text = `An EMI of ~${inr(emi)}/month is doable, but tight: it's ${share}% of your free money.\n\nYour ${goalName} would arrive later, and there'd be less room for surprises.`
  else
    text = `An EMI of ~${inr(emi)}/month is ${share}% of your free money. That's manageable alongside your ${goalName} plan${plan ? '' : ' (once you lock one)'}.\n\nJust check for processing fees, even on "no-cost" EMIs.`

  return msg({
    text,
    note: 'Illustrative: assumes a 12-month no-cost EMI.',
    actions: [
      { id: 'emi_compare', label: 'Show me both options', primary: true, payload: { price, item } },
      { id: 'keep_plan', label: 'Keep my current plan' },
    ],
  })
}

function fomoReply(): AgentMessage {
  return msg({
    text: "Hot tips feel urgent. That's kind of the point.\n\nI won't tell you what to buy, and I won't block you either. Before you invest, let's run a 20-second FOMO Check so you know why you're doing it.",
    actions: [{ id: 'open_fomo', label: 'Run FOMO Check', primary: true }],
  })
}

function healthReply(ctx: AgentContext): AgentMessage {
  const { user, health } = ctxBits(ctx)
  const best = [...PILLARS].sort((a, b) => health[b.key] - health[a.key])[0]
  const p = topPriority(user, health)
  return msg({
    text: `Your Money Health is ${health.total}/100: ${healthLabel(health.total).toLowerCase()}.\n\nStrongest: ${best.label} (${health[best.key]}).\n${p.title}`,
    actions: [{ id: 'open_health', label: 'See my Money Health', primary: true }],
  })
}

const LESSON_ANSWERS: { keys: string[]; id: string; text: string }[] = [
  { keys: ['sip'], id: 'sip', text: 'An SIP is just auto-investing a fixed amount every month, like a subscription for your future self. You buy more units when prices are low and fewer when high, so you stop worrying about timing.' },
  { keys: ['fd', 'fixed deposit'], id: 'fd', text: 'An FD locks your money with a bank for a fixed time at a fixed rate. Low drama, predictable. Good for money you need soon, like your goal fund.' },
  { keys: ['compound'], id: 'compound', text: 'Compounding means your growth starts earning growth. It feels slow at first, then speeds up, which is why starting early matters more than starting big.' },
  { keys: ['diversif'], id: 'diversify', text: "Diversification means not betting everything on one thing. If one company or sector has a bad year, the rest can cushion it." },
  { keys: ['fall', 'crash', 'down'], id: 'fall', text: 'Investments fall because prices reflect what people expect about the future, and expectations change. Dips are normal; what matters is whether you can wait them out.' },
  { keys: ['mutual fund', 'index'], id: 'diversify', text: 'A mutual fund pools money from many people and invests it in many companies. An index fund is the low-cost version that simply copies a market index like the Nifty 50.' },
]

function learnReply(t: string): AgentMessage {
  const hit = LESSON_ANSWERS.find((l) => l.keys.some((k) => t.includes(k))) ?? LESSON_ANSWERS[0]
  return msg({
    text: hit.text,
    actions: [{ id: 'open_lesson', label: 'Watch the 45-sec Money Minute', primary: true, payload: { lesson: hit.id } }],
  })
}

function goalReply(ctx: AgentContext): AgentMessage {
  const { goal, plan } = ctxBits(ctx)
  if (!goal) return fallbackReply()
  const progress = Math.round(pct(goal.currentAmount, goal.targetAmount))
  const base = `${goal.emoji} ${goal.name}: ${inr(goal.currentAmount)} of ${inr(goal.targetAmount)} (${progress}%).`
  if (!plan)
    return msg({
      text: `${base}\n\nYou haven't picked a plan yet. Let's turn it into a monthly number.`,
      actions: [{ id: 'open_goal', label: `Plan my ${goal.name}`, primary: true }],
    })
  return msg({
    text: `${base}\n\nWith your ${plan.title} plan (${inr(plan.toGoal)}/month), you could get there around ${plan.date}. ${inr(remainingFor(goal))} to go.`,
    actions: [{ id: 'open_goal', label: 'Open goal', primary: true }],
  })
}

function safetyReply(): AgentMessage {
  return msg({
    text: "Honest answer: nobody can guarantee returns. Not me, not an app, not a finfluencer. Anyone promising sure-shot profits is a red flag.\n\nWhat you can control: how much you put in, how long you stay, and how spread out your money is.",
    actions: [
      { id: 'open_lesson', label: 'Why investments fall', primary: true, payload: { lesson: 'fall' } },
      { id: 'open_fomo', label: 'Run a FOMO Check' },
    ],
  })
}

function fallbackReply(): AgentMessage {
  return msg({
    text: "I'm your money coach (demo mode), so I'm best at a few things right now. Try one:",
    actions: [
      { id: 'ask', label: 'I have ₹5,000 left', payload: { prompt: 'I have ₹5,000 left this month' } },
      { id: 'ask', label: 'iPhone on EMI?', payload: { prompt: 'Should I buy this iPhone on EMI?' } },
      { id: 'ask', label: 'How am I doing?', payload: { prompt: 'How am I doing?' } },
    ],
  })
}

/* ---------------------------- follow-ups ---------------------------- */

export function agentFollowUp(action: AgentAction, ctx: AgentContext): AgentMessage | null {
  const { user, goal, plan, health } = ctxBits(ctx)
  const goalName = goal?.name ?? 'goal'
  const p = action.payload ?? {}

  switch (action.id) {
    case 'apply_split': {
      const toGoal = Number(p.toGoal)
      const weeks = plan && plan.toGoal > 0 ? Math.max(1, Math.round((toGoal / plan.toGoal) * 4.3)) : null
      return msg({
        text: `Done. ${inr(toGoal)} moved to ${goalName}${weeks ? `, about ${weeks} week${weeks > 1 ? 's' : ''} closer` : ''}. The rest is yours to enjoy, guilt-free.`,
      })
    }
    case 'explain_split': {
      const x = Number(p.amount)
      const s = splitAmounts(x)
      return msg({
        text:
          `Why this split?\n\n` +
          `• ${inr(s.toGoal)} to ${goalName}: speeds it up without making it your only priority.\n` +
          `• ${inr(s.toInvest)} to long-term investing: small, regular amounts matter more than timing.\n` +
          `• ${inr(s.flexible)} flexible: you earned it. Plans with zero fun money usually break.` +
          (health.emergencyScore < 60
            ? `\n\nOne more thing: your emergency buffer is your lowest score (${health.emergencyScore}). You could send the ${inr(s.toInvest)} there instead.`
            : ''),
        actions: [{ id: 'apply_split', label: 'Use this plan', primary: true, payload: { amount: x, toGoal: s.toGoal } }],
      })
    }
    case 'emi_compare': {
      const price = Number(p.price)
      const item = String(p.item)
      const label = item === 'this' ? 'it' : item
      const emi = roundUp(price / 12, 10)
      const free = Math.max(0, user.monthlyAvailable - emi)
      const goalMonthly = plan ? Math.min(plan.toGoal, free) : 0
      const remaining = goal ? remainingFor(goal) : 0
      const goalDate = goalMonthly > 0 ? monthLabel(Math.ceil(remaining / goalMonthly) + (user.monthsElapsed ?? 0)) : 'paused'
      const investLeft = Math.max(0, free - goalMonthly)
      const saveMonthly = Math.max(1000, user.monthlyAvailable - user.monthlyInvestment)
      const after = plan ? plan.months : 0
      const saveDate = monthLabel(after + Math.ceil(price / saveMonthly) + (user.monthsElapsed ?? 0))
      return msg({
        text:
          `Option A: EMI now\n` +
          `${inr(emi)}/month for 12 months. ${goalName} ${goalDate === 'paused' ? 'pauses' : `moves to ${goalDate}`}, investing drops to ${inr(investLeft)}/month.\n\n` +
          `Option B: Save for it next\n` +
          `Finish your ${goalName} first, then put ${inr(saveMonthly)}/month toward ${label}. You'd own it around ${saveDate}, with no interest or fees, and your investing untouched.\n\n` +
          `Both are valid. A gets it sooner; B keeps your momentum.`,
        note: 'Illustrative numbers. Your call either way.',
        actions: [
          { id: 'add_goal', label: `Add ${item === 'this' ? 'it' : item} as next goal`, primary: true, payload: { item, price } },
          { id: 'keep_plan', label: 'Keep my current plan' },
        ],
      })
    }
    case 'keep_plan':
      return msg({
        text: plan
          ? `Locked in. Your ${goalName} plan stays at ${inr(plan.toGoal)}/month, done around ${plan.date}. 🔒`
          : `Got it, nothing changes. Want to lock a plan for your ${goalName} next?`,
        actions: plan ? undefined : [{ id: 'open_goal', label: `Plan my ${goalName}`, primary: true }],
      })
    case 'add_goal':
      return msg({
        text: `Added ${p.item === 'this' ? 'it' : p.item} to your goals. It'll start once your ${goalName} is done, so nothing about this month changes.`,
      })
    default:
      return null
  }
}
