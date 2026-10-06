export type Risk = 'low' | 'medium' | 'high'
export type Experience = 'none' | 'some' | 'regular'
export type PlanId = 'save' | 'balanced' | 'wait'

export interface Goal {
  id: string
  kind: string
  name: string
  emoji: string
  targetAmount: number
  currentAmount: number
  /** Months from today the user wants this by (drives the "fastest" plan). */
  targetMonths: number
  /** Monthly amount committed once a plan is locked. */
  monthlyContribution: number
  plan: PlanId | null
}

export interface User {
  name: string
  age: number
  income: number
  /** Money left each month after essentials (rent, food, bills). */
  monthlyAvailable: number
  /** General savings, not earmarked for a goal. Counts as emergency buffer. */
  savings: number
  monthlyInvestment: number
  experience: Experience
  risk: Risk
  /** Mocked: share of credit limit typically used (0–1). */
  creditUtilization: number
  goals: Goal[]
  activeGoalId: string
  /** Simulated clock: monthly moves made so far (keeps "ready by" dates fixed). */
  monthsElapsed?: number
}

export interface Investment {
  id: string
  name: string
  category: 'Index Fund' | 'Mutual Fund' | 'ETF' | 'Stock'
  emoji: string
  risk: 'Low' | 'Medium' | 'High'
  timeHorizon: string
  description: string
  whyFits: string
  downside: string
}

export interface FinancialHealth {
  savingScore: number
  investingScore: number
  creditScore: number
  emergencyScore: number
  goalScore: number
  total: number
}

export interface XpEvent {
  id: string
  label: string
  xp: number
  at: number
}
