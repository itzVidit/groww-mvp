import type { User } from '../types.ts'
import { monthLabel, roundUp } from './format.ts'
import { activePlan, remainingFor } from './plan.ts'

/**
 * "Can I afford it?": Buy now (EMI) vs Build first vs Invest + wait.
 * Same 0%-return honesty as the goal planner: nothing here relies on growth.
 */

export type AffordId = 'buy' | 'build' | 'wait'

export interface AffordOption {
  id: AffordId
  title: string
  tagline: string
  /** Monthly cash that goes to the item while it's being paid for or saved. */
  monthlyToItem: number
  /** Goal ready-by date (or 'paused'). */
  goalDate: string
  /** Monthly investing while the option runs, and after the active goal is done. */
  investing: number
  investingAfter: number
  /** Emergency buffer contribution per month (it comes out of flexible money first). */
  buffer: number
  /** When you'd own the item. */
  ownDate: string
  /** EMI as % of free money (Buy now only). */
  emiShare: number | null
  /** Extra interest/fees risk: only the EMI route has any. */
  note: string
}

export interface AffordResult {
  price: number
  emi: number
  months: number
  options: AffordOption[]
}

export const EMI_MONTHS = [6, 12, 18] as const
export const DEFAULT_PRICES: Record<string, number> = { iPhone: 79_900, Laptop: 70_000, Bike: 1_20_000 }

export function computeAfford(user: User, price: number, months = 12): AffordResult {
  const goal = user.goals.find((g) => g.id === user.activeGoalId)
  const plan = activePlan(goal, user)
  const A = user.monthlyAvailable
  const I = user.monthlyInvestment
  const elapsed = user.monthsElapsed ?? 0
  const remaining = goal ? remainingFor(goal) : 0
  const emi = roundUp(price / months, 10)
  const bufferGoal = user.goals.find((g) => g.kind === 'buffer' && g.currentAmount < g.targetAmount)
  const bufferWant = bufferGoal ? bufferGoal.monthlyContribution : 1000

  // Buy now: the EMI comes off the top, the goal and investing share what's left.
  const afterEmi = Math.max(0, A - emi)
  const buyGoal = plan ? Math.min(plan.toGoal, afterEmi) : 0
  const buyInvest = Math.min(I, Math.max(0, afterEmi - buyGoal))
  const buyFlex = Math.max(0, afterEmi - buyGoal - buyInvest)
  const buyGoalDate = buyGoal > 0 ? monthLabel(Math.ceil(remaining / buyGoal) + elapsed) : remaining === 0 ? 'done' : 'paused'

  // After the goal is done, the plan's goal money is free: that's what builds the item.
  const planMonths = plan ? plan.months : 0
  const saveMonthly = Math.max(1000, A - I)
  const buildOwn = monthLabel(planMonths + Math.ceil(price / saveMonthly) + elapsed)
  const half = Math.max(500, Math.round(saveMonthly / 2))
  const waitOwn = monthLabel(planMonths + Math.ceil(price / half) + elapsed)

  const goalDate = plan ? plan.date : 'when you lock a plan'
  const planInvest = plan ? plan.toInvest : Math.min(I, A)
  const planFlex = plan ? plan.flexible : Math.max(0, A - planInvest)

  const options: AffordOption[] = [
    {
      id: 'buy', title: 'Buy now (EMI)', tagline: 'Fastest to own. Costs the most room.',
      monthlyToItem: emi, goalDate, investing: buyInvest, investingAfter: I,
      buffer: Math.min(bufferWant, buyFlex), ownDate: 'Today',
      emiShare: A > 0 ? Math.round((emi / A) * 100) : 100,
      note: 'Check for processing fees, even on "no-cost" EMIs.',
    },
    {
      id: 'build', title: 'Build first', tagline: 'Finish your goal, then save for it.',
      monthlyToItem: 0, goalDate, investing: planInvest, investingAfter: I,
      buffer: Math.min(bufferWant, planFlex), ownDate: buildOwn, emiShare: null,
      note: 'No interest or fees. Your investing never pauses.',
    },
    {
      id: 'wait', title: 'Invest + wait', tagline: 'Half to the item, half to investing.',
      monthlyToItem: 0, goalDate, investing: planInvest, investingAfter: I + Math.max(0, saveMonthly - half),
      buffer: Math.min(bufferWant, planFlex), ownDate: waitOwn, emiShare: null,
      note: 'Slower to own, but your long-term investing grows while you wait.',
    },
  ]
  // Goal date for Buy now is computed from the squeezed monthly, not the locked plan.
  options[0].goalDate = plan ? buyGoalDate : goalDate
  return { price, emi, months, options }
}

/** Core of the monthly EMI burden shown in Money Health and the monthly waterfall. */
export const emiShareOf = (monthly: number, free: number) => (free > 0 ? Math.min(100, Math.round((monthly / free) * 100)) : 100)
