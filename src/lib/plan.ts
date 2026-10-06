import type { Goal, PlanId, User } from '../types.ts'
import { monthLabel, roundUp } from './format.ts'

export interface PlanOption {
  id: PlanId
  title: string
  tagline: string
  months: number
  date: string
  toGoal: number
  toInvest: number
  flexible: number
  /** How much more than the user's available money this plan needs each month. */
  shortfall: number
  /** How much this plan trims the user's usual monthly investing. */
  investCut: number
}

export const remainingFor = (g: Goal) => Math.max(0, g.targetAmount - g.currentAmount)

/**
 * Months needed for each plan, given the user's "I want it by" months.
 * Extra months are constant for short goals, so a locked plan's monthly amount
 * stays steady as `base` counts down after each monthly move.
 */
export function planMonths(base: number): Record<PlanId, number> {
  const b = Math.max(1, Math.round(base))
  return { save: b, balanced: b + Math.max(2, Math.round(b * 0.25)), wait: b + Math.max(4, Math.round(b * 0.5)) }
}

/**
 * Three ways to reach a goal. No returns are assumed on goal money:
 * short-term goal money should sit somewhere safe, so the maths stays honest.
 */
export function planOptions(goal: Goal, user: User, baseMonths = goal.targetMonths): PlanOption[] {
  const remaining = remainingFor(goal)
  const A = user.monthlyAvailable
  const I = user.monthlyInvestment
  const months = planMonths(baseMonths)

  const make = (id: PlanId, title: string, tagline: string): PlanOption => {
    const m = months[id]
    const toGoal = remaining === 0 ? 0 : roundUp(remaining / m, 5)
    const toInvest = Math.min(I, Math.max(0, A - toGoal))
    const flexible = Math.max(0, A - toGoal - toInvest)
    return {
      id, title, tagline, months: m, date: monthLabel(m + (user.monthsElapsed ?? 0)),
      toGoal, toInvest, flexible,
      shortfall: Math.max(0, toGoal - A),
      investCut: Math.max(0, I - toInvest),
    }
  }

  return [
    make('save', 'Save', 'Fastest. Everything goes to the goal.'),
    make('balanced', 'Save + Invest', 'A little later. Your investing keeps running.'),
    make('wait', 'Wait longer', 'Lowest monthly. More room to live.'),
  ]
}

export function activePlan(goal: Goal | undefined, user: User): PlanOption | null {
  if (!goal || !goal.plan) return null
  return planOptions(goal, user).find((p) => p.id === goal.plan) ?? null
}

export const PLAN_RECOMMENDED: PlanId = 'balanced'

/** Where goal money could live, based on how soon it's needed. Plain language, not advice. */
export function horizonNote(months: number): { where: string; why: string } {
  if (months <= 12)
    return {
      where: 'Savings account, FD or a liquid fund',
      why: "You need this money within a year, so keep it somewhere that won't drop right before you buy.",
    }
  if (months <= 36)
    return {
      where: 'A mix of safer options and some hybrid funds',
      why: 'A few years of runway lets you take a little more risk. Just not all of it.',
    }
  return {
    where: 'Long-term options like index funds',
    why: 'With 3+ years, you have time to ride out market dips. There will be dips.',
  }
}

export interface MonthlyMove {
  toGoal: number
  toBuffer: number
  toInvest: number
  flexible: number
  total: number
}

/** This month's split of available money, from the locked plan (+ buffer if started). */
export function monthlyMove(user: User): MonthlyMove {
  const goal = user.goals.find((g) => g.id === user.activeGoalId)
  const buffer = user.goals.find((g) => g.kind === 'buffer' && g.currentAmount < g.targetAmount)
  const plan = activePlan(goal, user)
  const A = user.monthlyAvailable
  let toGoal = plan ? plan.toGoal : 0
  let toInvest = plan ? plan.toInvest : Math.min(user.monthlyInvestment, A)
  let flexible = plan ? plan.flexible : Math.max(0, A - toInvest)
  let toBuffer = 0
  if (buffer) {
    // Buffer money comes out of flexible spending first, then investing.
    toBuffer = Math.min(buffer.monthlyContribution, buffer.targetAmount - buffer.currentAmount)
    const fromFlex = Math.min(flexible, toBuffer)
    flexible -= fromFlex
    const rest = toBuffer - fromFlex
    const fromInvest = Math.min(toInvest, rest)
    toInvest -= fromInvest
    toGoal = Math.max(0, toGoal - (rest - fromInvest))
  }
  return { toGoal, toBuffer, toInvest, flexible, total: toGoal + toBuffer + toInvest + flexible }
}
