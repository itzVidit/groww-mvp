import type { FinancialHealth, User } from '../types.ts'
import { clamp, pct } from './format.ts'
import { emiShareOf } from './afford.ts'
import { activePlan, remainingFor } from './plan.ts'

export type PillarKey = 'savingScore' | 'investingScore' | 'creditScore' | 'emergencyScore' | 'goalScore'

export const PILLARS: { key: PillarKey; label: string; weight: number }[] = [
  { key: 'savingScore', label: 'Saving', weight: 0.25 },
  { key: 'investingScore', label: 'Investing', weight: 0.2 },
  { key: 'creditScore', label: 'Credit', weight: 0.15 },
  { key: 'emergencyScore', label: 'Emergency buffer', weight: 0.12 },
  { key: 'goalScore', label: 'Goals', weight: 0.28 },
]

/** Months of essential spending covered by general savings + buffer goal. */
export function bufferMonths(user: User) {
  const essentials = Math.max(1, user.income - user.monthlyAvailable)
  const buffer = user.goals.filter((g) => g.kind === 'buffer').reduce((s, g) => s + g.currentAmount, 0)
  return (user.savings + buffer) / essentials
}

/**
 * Behavioural health score: a product heuristic, not a credit or risk model.
 * Each pillar maps one simple habit to 0–100.
 */
export function computeHealth(user: User): FinancialHealth {
  const goal = user.goals.find((g) => g.id === user.activeGoalId)
  const plan = activePlan(goal, user)
  const invest = plan ? plan.toInvest : user.monthlyInvestment

  const savingScore = clamp(Math.round(40 + (user.monthlyAvailable / user.income) * 183))
  const investingScore = clamp(Math.round(45 + (invest / user.income) * 300))
  // A confirmed EMI counts against credit: the bigger its share of free money, the bigger the hit.
  const emiHit = user.emi ? Math.round(emiShareOf(user.emi.monthly, user.monthlyAvailable) * 0.4) : 0
  const creditScore = clamp(Math.round(100 - user.creditUtilization * 70 - emiHit))
  const emergencyScore = clamp(Math.round(28 + bufferMonths(user) * 23))

  let goalScore = 40
  if (goal) {
    const progress = pct(goal.currentAmount, goal.targetAmount)
    const onTrack = plan && plan.shortfall === 0
    goalScore = remainingFor(goal) === 0 ? 100 : clamp(Math.round((onTrack ? 70 : 55) + progress * 0.37))
  }

  const scores = { savingScore, investingScore, creditScore, emergencyScore, goalScore }
  const total = Math.round(PILLARS.reduce((s, p) => s + scores[p.key] * p.weight, 0))
  return { ...scores, total }
}

export function healthLabel(total: number) {
  if (total >= 85) return 'Strong'
  if (total >= 70) return 'Good, and getting stronger'
  if (total >= 55) return 'Building up'
  return 'Needs attention'
}

export interface Priority {
  key: PillarKey
  title: string
  body: string
  cta: string
}

const PRIORITY_COPY: Record<PillarKey, Omit<Priority, 'key'>> = {
  emergencyScore: {
    title: 'Your emergency buffer is your biggest opportunity.',
    body: 'Your savings cover about {months} of essentials. One surprise bill could knock your {goal} plan off track. A small buffer protects your goals.',
    cta: 'Build ₹5,000 buffer',
  },
  investingScore: {
    title: 'Your long-term investing could use a nudge.',
    body: 'Your goal plan is squeezing your monthly investing. Even ₹500 more a month keeps the long-term habit alive.',
    cta: 'Rebalance my plan',
  },
  savingScore: {
    title: 'More of your income could be working for you.',
    body: 'Finding even ₹1,000 a month of spending to redirect makes every goal arrive sooner.',
    cta: 'Ask Money Agent how',
  },
  creditScore: {
    title: 'Keep credit card use low.',
    body: 'Using under 30% of your limit and paying in full keeps your credit healthy for future big things.',
    cta: 'Ask Money Agent',
  },
  goalScore: {
    title: 'Lock a plan for your {goal}.',
    body: 'A goal without a monthly number is just a wish. Pick a plan and your health jumps.',
    cta: 'Plan my goal',
  },
}

export function topPriority(user: User, h = computeHealth(user)): Priority {
  const goal = user.goals.find((g) => g.id === user.activeGoalId)
  const lowest = [...PILLARS].sort((a, b) => h[a.key] - h[b.key])[0].key
  // An unplanned goal is the most actionable fix, so it wins over everything.
  const key: PillarKey = goal && !goal.plan ? 'goalScore' : lowest
  const copy = PRIORITY_COPY[key]
  const months = bufferMonths(user)
  const fill = (s: string) =>
    s
      .replace('{months}', months < 1.5 ? 'one month' : `${months.toFixed(1)} months`)
      .replace('{goal}', goal?.name ?? 'goal')
  return { key, title: fill(copy.title), body: fill(copy.body), cta: copy.cta }
}

export const PILLAR_HINT: Record<PillarKey, (u: User) => string> = {
  savingScore: (u) => `${Math.round((u.monthlyAvailable / u.income) * 100)}% of your income is free to save or invest.`,
  investingScore: (u) => {
    const g = u.goals.find((x) => x.id === u.activeGoalId)
    const p = activePlan(g, u)
    return p && p.investCut > 0
      ? `Your goal plan trims investing to ₹${p.toInvest.toLocaleString('en-IN')}/month.`
      : 'You invest every month. Consistency beats timing.'
  },
  creditScore: (u) =>
    u.emi
      ? `Your ${u.emi.item} EMI (₹${u.emi.monthly.toLocaleString('en-IN')}/mo, ${u.emi.monthsLeft} left) takes ${emiShareOf(u.emi.monthly, u.monthlyAvailable)}% of your free money. The rest is a sample profile.`
      : `Sample profile: ${Math.round(u.creditUtilization * 100)}% of card limit used, no missed payments.`,
  emergencyScore: (u) => `Covers ~${bufferMonths(u).toFixed(1)} months of essentials. 3 months is a good target.`,
  goalScore: (u) => {
    const g = u.goals.find((x) => x.id === u.activeGoalId)
    return g?.plan ? `${g.name} plan locked and on track.` : 'Your goal has no plan yet.'
  },
}
