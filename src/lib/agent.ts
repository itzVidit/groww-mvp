import type { User } from '../types.ts'
import { inr, parseAmount, pct, roundTo, roundUp } from './format.ts'
import { computeHealth, healthLabel, PILLARS, topPriority } from './health.ts'
import { activePlan, monthlyMove, remainingFor } from './plan.ts'
import { computeAfford, type AffordOption } from './afford.ts'
import { HISTORIC_RETURNS, rangeLabel } from '../data/returns.ts'

/**
 * Money Agent: a rule-based coach. No LLM: it matches intent with keywords
 * and builds replies from the user's live numbers. It never picks stocks and
 * never promises returns.
 */

export type AgentActionId =
  | 'apply_split' | 'explain_split' | 'emi_compare' | 'keep_plan' | 'add_goal'
  | 'open_fomo' | 'open_afford' | 'open_returns' | 'open_health' | 'open_lesson' | 'open_goal' | 'ask'

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
  /** What the reply drew on, shown as "Based on: ..." so the user can see it's their numbers. */
  basis?: string[]
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
  'Can I afford an iPhone?',
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

type Basis = 'plan' | 'free' | 'buffer' | 'health' | 'goal' | 'emi'

/** Plain-language list of the user's numbers a reply was built from. */
function basisFor(ctx: AgentContext, ...keys: Basis[]): string[] {
  const { user, goal, plan, health } = ctxBits(ctx)
  const map: Record<Basis, string | null> = {
    plan: plan && goal ? `Your ${goal.name} plan (${inr(plan.toGoal)}/mo)` : null,
    goal: goal ? `${goal.name}: ${inr(goal.currentAmount)} of ${inr(goal.targetAmount)}` : null,
    free: `Free money ${inr(user.monthlyAvailable)}/mo`,
    buffer: `Emergency buffer score ${health.emergencyScore}`,
    health: `Money Health ${health.total}`,
    emi: user.emi ? `Your ${user.emi.item} EMI (${inr(user.emi.monthly)}/mo)` : null,
  }
  return keys.map((k) => map[k]).filter((x): x is string => !!x)
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
  if (has(t, ['return', 'nifty', 'cagr', 'historic', 'past performance', 'liquid fund', 'reit', 'fd vs', 'fd rate', 'fd or']))
    return returnsReply()
  if (has(t, ['sip', ' fd', 'fd ', 'fixed deposit', 'compound', 'diversif', 'fall', 'crash', 'what is', "what's", 'explain', 'mutual fund', 'index']))
    return learnReply(t)
  if (has(t, ['goal', 'ps5', 'when', 'how long']))
    return goalReply(ctx)
  if (has(t, ['salary', 'budget', 'income']))
    return splitReply(ctx.user.monthlyAvailable, ctx, true)
  return fallbackReply()
}

/* ----------------------------- intents ----------------------------- */

export interface Split { toBuffer: number; toGoal: number; toInvest: number; flexible: number }

/**
 * Plan-aware split of an amount. Order: top up the buffer if it's the weakest
 * pillar, then the goal (up to the locked plan's monthly), then investing, then flex.
 * With no plan locked it falls back to a simple 40/25/rest split.
 */
export function splitPlan(x: number, user: User): Split {
  const goal = user.goals.find((g) => g.id === user.activeGoalId)
  const plan = activePlan(goal, user)
  const health = computeHealth(user)
  const lowest = [...PILLARS].sort((a, b) => health[a.key] - health[b.key])[0].key
  const buffer = user.goals.find((g) => g.kind === 'buffer')
  const bufferGap = buffer ? Math.max(0, buffer.targetAmount - buffer.currentAmount) : 5000

  let left = x
  const toBuffer = lowest === 'emergencyScore' ? Math.min(left, 1000, bufferGap) : 0
  left -= toBuffer
  const toGoal = Math.min(left, plan ? plan.toGoal : roundTo(x * 0.4, 100), goal ? remainingFor(goal) : 0)
  left -= toGoal
  const toInvest = Math.min(left, plan ? plan.toInvest : roundTo(x * 0.25, 100))
  left -= toInvest
  return { toBuffer, toGoal, toInvest, flexible: left }
}

function splitLines(s: Split, goalName: string, emi = 0): AgentLine[] {
  const lines: AgentLine[] = [
    { label: goalName, amount: s.toGoal, tone: 'goal' },
    { label: 'Emergency buffer', amount: s.toBuffer, tone: 'buffer' },
    { label: 'Long-term investing', amount: s.toInvest, tone: 'invest' },
    { label: 'Flexible spending', amount: s.flexible, tone: 'flex' },
    { label: 'EMI', amount: emi, tone: 'warn' },
  ]
  return lines.filter((l) => l.amount > 0 || l.tone === 'goal')
}

function splitReply(x: number, ctx: AgentContext, isMonthly = false): AgentMessage {
  const { user, goal, plan } = ctxBits(ctx)
  const name = goal?.name ?? 'goal'
  // The monthly question reuses Home's exact move, so the two never disagree.
  const mv = isMonthly ? monthlyMove(user) : null
  const s: Split = mv ?? splitPlan(x, user)
  let opener: string
  if (isMonthly) opener = `You have about ${inr(x)} free this month after essentials.`
  else if (!goal?.plan) opener = `You haven't locked a plan for your ${name} yet, but here's a balanced way to use ${inr(x)}.`
  else if (ctx.movedThisMonth) opener = `You're ahead of your ${name} goal: this month's move is already done.`
  else opener = `Your ${name} goal is on track once you make this month's ${inr(plan!.toGoal)} move.`

  return msg({
    text: `${opener}\n\nFollowing your plan, ${inr(x)} could go:`,
    lines: splitLines(s, name, mv?.emi ?? 0),
    basis: basisFor(ctx, 'plan', 'free', 'buffer', 'emi'),
    note: s.flexible === 0 && !isMonthly
      ? 'Nothing is left for fun money this time. That is fine for one top-up, just don\'t make it a habit.'
      : plan
      ? `The goal gets what your ${plan.title} plan asks for (${inr(plan.toGoal)}/month), never more than it needs.`
      : 'This keeps your goal on track without putting your entire surplus into one goal.',
    actions: [
      { id: 'apply_split', label: isMonthly ? "Make this month's move" : 'Use this plan', primary: true,
        payload: { amount: x, toGoal: s.toGoal, toBuffer: s.toBuffer, monthly: isMonthly ? 1 : 0 } },
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
    basis: basisFor(ctx, 'free', 'plan', 'emi'),
    actions: [
      { id: 'emi_compare', label: 'Show me the options', primary: true, payload: { price, item } },
      { id: 'keep_plan', label: 'Keep my current plan' },
    ],
  })
}

function returnsReply(): AgentMessage {
  const [nifty, , hybrid, reit, fd, liquid] = HISTORIC_RETURNS
  return msg({
    text:
      `Here's what these have returned per year in the past, not what they'll do next:\n\n` +
      `• ${nifty.name}: about ${nifty.periods[1].v} over 10 years, with falls of ~38% along the way.\n` +
      `• Aggressive hybrid funds: ${hybrid.periods[1].v} over 10 years.\n` +
      `• Office REITs: ${rangeLabel(reit)} since listing, mostly rent.\n` +
      `• Bank FDs: ${rangeLabel(fd)}. Liquid funds: ${rangeLabel(liquid)}.\n\n` +
      `Higher past returns came with bigger swings, so the right place depends on when you need the money. Goal money due soon belongs in the steady end.`,
    note: 'Rounded, category-level, mid-2026. Past returns do not predict future ones.',
    actions: [{ id: 'open_returns', label: 'Compare them side by side', primary: true }],
  })
}

function fomoReply(): AgentMessage {
  return msg({
    text: "Hot tips feel urgent. That's kind of the point.\n\nI won't tell you what to buy, and I won't block you either. Before you invest, let's run a 20-second FOMO Shield check so you know why you're doing it.",
    actions: [{ id: 'open_fomo', label: 'Run FOMO Shield', primary: true }],
  })
}

function healthReply(ctx: AgentContext): AgentMessage {
  const { user, health } = ctxBits(ctx)
  const best = [...PILLARS].sort((a, b) => health[b.key] - health[a.key])[0]
  const p = topPriority(user, health)
  return msg({
    text: `Your Money Health is ${health.total}/100: ${healthLabel(health.total).toLowerCase()}.\n\nStrongest: ${best.label} (${health[best.key]}).\n${p.title}`,
    basis: basisFor(ctx, 'health', 'buffer', 'plan'),
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
  const basis = basisFor(ctx, 'goal', 'plan', 'free')
  const progress = Math.round(pct(goal.currentAmount, goal.targetAmount))
  const base = `${goal.emoji} ${goal.name}: ${inr(goal.currentAmount)} of ${inr(goal.targetAmount)} (${progress}%).`
  if (!plan)
    return msg({
      text: `${base}\n\nYou haven't picked a plan yet. Let's turn it into a monthly number.`,
      basis,
      actions: [{ id: 'open_goal', label: `Plan my ${goal.name}`, primary: true }],
    })
  return msg({
    basis,
    text: `${base}\n\nWith your ${plan.title} plan (${inr(plan.toGoal)}/month), you could get there around ${plan.date}. ${inr(remainingFor(goal))} to go.`,
    actions: [{ id: 'open_goal', label: 'Open goal', primary: true }],
  })
}

function safetyReply(): AgentMessage {
  return msg({
    text: "Honest answer: nobody can guarantee returns. Not me, not an app, not a finfluencer. Anyone promising sure-shot profits is a red flag.\n\nWhat you can control: how much you put in, how long you stay, and how spread out your money is.",
    actions: [
      { id: 'open_lesson', label: 'Why investments fall', primary: true, payload: { lesson: 'fall' } },
      { id: 'open_fomo', label: 'Run a FOMO Shield check' },
    ],
  })
}

function fallbackReply(): AgentMessage {
  return msg({
    text: "I'm your money coach (demo mode), so I'm best at a few things right now. Try one:",
    actions: [
      { id: 'ask', label: 'I have ₹5,000 left', payload: { prompt: 'I have ₹5,000 left this month' } },
      { id: 'ask', label: 'Afford an iPhone?', payload: { prompt: 'Can I afford an iPhone?' } },
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
      const toBuffer = Number(p.toBuffer ?? 0)
      const weeks = plan && plan.toGoal > 0 ? Math.max(1, Math.round((toGoal / plan.toGoal) * 4.3)) : null
      const parts = [
        toGoal > 0 ? `${inr(toGoal)} moved to ${goalName}${weeks ? `, about ${weeks} week${weeks > 1 ? 's' : ''} closer` : ''}` : null,
        toBuffer > 0 ? `${inr(toBuffer)} to your emergency buffer` : null,
      ].filter(Boolean)
      return msg({ text: `Done. ${parts.join(' and ')}. The rest is yours to enjoy, guilt-free.` })
    }
    case 'explain_split': {
      const x = Number(p.amount)
      const s = splitPlan(x, user)
      const lines = [
        s.toBuffer > 0 ? `• ${inr(s.toBuffer)} to your emergency buffer: it's your lowest score (${health.emergencyScore}), so it comes first.` : null,
        `• ${inr(s.toGoal)} to ${goalName}: matches your plan${plan ? ` (${inr(plan.toGoal)}/month)` : ''} without making it your only priority.`,
        s.toInvest > 0 ? `• ${inr(s.toInvest)} to long-term investing: small, regular amounts matter more than timing.` : null,
        s.flexible > 0 ? `• ${inr(s.flexible)} flexible: you earned it. Plans with zero fun money usually break.` : null,
      ].filter(Boolean)
      return msg({
        text: `Why this split?\n\n${lines.join('\n')}`,
        actions: [{ id: 'apply_split', label: 'Use this plan', primary: true, payload: { amount: x, toGoal: s.toGoal, toBuffer: s.toBuffer, monthly: 0 } }],
      })
    }
    case 'emi_compare': {
      const price = Number(p.price)
      const item = String(p.item)
      const label = item === 'this' ? 'it' : item
      const [buy, build, wait] = computeAfford(user, price).options
      const goalLine = (o: AffordOption) => (o.goalDate === 'paused' ? `${goalName} pauses` : `${goalName} ${o.goalDate === build.goalDate ? 'stays on' : 'moves to'} ${o.goalDate}`)
      return msg({
        text:
          `Option A: Buy now (EMI)\n` +
          `${inr(buy.monthlyToItem)}/month for 12 months. ${goalLine(buy)}, investing drops to ${inr(buy.investing)}/month.\n\n` +
          `Option B: Build first\n` +
          `Finish your ${goalName}, then save toward ${label}. You'd own it around ${build.ownDate}, with no interest, and your investing untouched.\n\n` +
          `Option C: Invest + wait\n` +
          `Half of that goes to ${label}, half to investing (up to ${inr(wait.investingAfter)}/month). You'd own it around ${wait.ownDate}.\n\n` +
          `A gets it sooner; B and C keep your momentum.`,
        note: 'Illustrative numbers. Your call either way.',
        basis: basisFor(ctx, 'free', 'plan', 'emi'),
        actions: [
          { id: 'open_afford', label: 'See the full comparison', primary: true, payload: { item, price } },
          { id: 'add_goal', label: `Add ${label} as next goal`, payload: { item, price } },
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
