import type { Goal, User, XpEvent } from '../types.ts'

export interface GoalTemplate {
  kind: string
  name: string
  emoji: string
  price: number
  months: number
  blurb: string
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { kind: 'iphone', name: 'iPhone', emoji: '📱', price: 79_900, months: 8, blurb: 'The new one. Not on EMI.' },
  { kind: 'ps5', name: 'PS5', emoji: '🎮', price: 55_000, months: 4, blurb: 'Game nights, sorted.' },
  { kind: 'travel', name: 'Travel', emoji: '✈️', price: 60_000, months: 6, blurb: 'Goa, Ladakh, or further.' },
  { kind: 'bike', name: 'Bike', emoji: '🏍️', price: 1_20_000, months: 12, blurb: 'Your own wheels.' },
  { kind: 'emergency', name: 'Emergency Fund', emoji: '🛟', price: 90_000, months: 12, blurb: 'Sleep-well money.' },
  { kind: 'lakh', name: 'First ₹1 Lakh', emoji: '💯', price: 1_00_000, months: 12, blurb: 'The first big milestone.' },
  { kind: 'freedom', name: 'Financial Freedom', emoji: '🕊️', price: 25_00_000, months: 120, blurb: 'Money that works for you.' },
  { kind: 'custom', name: 'Custom Goal', emoji: '✨', price: 30_000, months: 6, blurb: 'Anything you want.' },
]

export const templateFor = (kind: string) => GOAL_TEMPLATES.find((t) => t.kind === kind) ?? GOAL_TEMPLATES[7]

export function goalFromTemplate(t: GoalTemplate, overrides: Partial<Goal> = {}): Goal {
  return {
    id: t.kind + '-' + Math.random().toString(36).slice(2, 7),
    kind: t.kind,
    name: t.kind === 'custom' ? 'My goal' : t.name,
    emoji: t.emoji,
    targetAmount: t.price,
    currentAmount: 0,
    targetMonths: t.months,
    monthlyContribution: 0,
    plan: null,
    ...overrides,
  }
}

/* ------------------------------------------------------------------ */
/*  Default demo user. Edit these numbers to change the whole demo.    */
/* ------------------------------------------------------------------ */
export const DEMO_GOAL: Goal = {
  id: 'ps5',
  kind: 'ps5',
  name: 'PS5',
  emoji: '🎮',
  targetAmount: 55_000,
  currentAmount: 31_500,
  targetMonths: 4,
  monthlyContribution: 0,
  plan: null,
}

export const DEMO_USER: User = {
  name: 'Vidit',
  age: 22,
  income: 35_000,
  monthlyAvailable: 8_000,
  savings: 28_000,
  monthlyInvestment: 3_000,
  experience: 'some',
  risk: 'medium',
  creditUtilization: 0.3,
  goals: [DEMO_GOAL],
  activeGoalId: 'ps5',
}

export const DEMO_STREAK = 14
export const DEMO_XP = 340

const day = 86_400_000
export const demoXpLog = (): XpEvent[] => [
  { id: 'h3', label: 'Money Minute: Why investments fall', xp: 20, at: Date.now() - 2 * day },
  { id: 'h2', label: 'Stayed within goal budget', xp: 40, at: Date.now() - 6 * day },
  { id: 'h1', label: 'Invested last month', xp: 50, at: Date.now() - 9 * day },
]
