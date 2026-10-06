import type { User } from '../types.ts'
import { activePlan } from './plan.ts'

export interface TrendingAsset {
  id: string
  name: string
  ticker: string
  change7d: number
  mentions: string
  volatility: 'Low' | 'Medium' | 'High'
  blurb: string
  about: string
}

export const TRENDING: TrendingAsset = {
  id: 'voltedge',
  name: 'VoltEdge EV',
  ticker: 'VOLTEDGE',
  change7d: 38,
  mentions: '12.4k posts this week',
  volatility: 'High',
  blurb: 'Everyone is talking about VoltEdge.',
  about:
    'A small, hypothetical EV-charging company. Revenue is growing, but it is not yet profitable, and most of the recent price jump came after a viral reel.',
}

export type FomoSignal = 'social' | 'friend' | 'spike' | 'missout' | 'research' | 'plan'

export const SIGNALS: { id: FomoSignal; label: string; points: number; reason: string }[] = [
  { id: 'social', label: 'Saw it on Instagram / YouTube', points: 20, reason: 'Trending on social media' },
  { id: 'friend', label: 'A friend or group chat recommended it', points: 15, reason: 'Someone recommended it' },
  { id: 'spike', label: 'The price is shooting up', points: 20, reason: 'Price jumped fast, and fast rises can reverse fast' },
  { id: 'missout', label: "I don't want to miss out", points: 20, reason: 'Fear of missing out is part of the decision' },
  { id: 'research', label: "I've read about the business", points: -15, reason: 'You researched the business' },
  { id: 'plan', label: 'It fits my long-term plan', points: -10, reason: 'It fits your long-term plan' },
]

export type FomoLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface FomoResult {
  score: number
  level: FomoLevel
  reasons: { text: string; tone: 'risk' | 'good' }[]
}

/** A behavioural nudge from the user's own answers + simple context. Not a prediction. */
export function fomoScore(signals: FomoSignal[], asset: TrendingAsset, user: User): FomoResult {
  let score = 0
  const reasons: FomoResult['reasons'] = []
  for (const s of SIGNALS) {
    if (!signals.includes(s.id)) continue
    score += s.points
    reasons.push({ text: s.reason, tone: s.points > 0 ? 'risk' : 'good' })
  }
  if (asset.volatility === 'High') {
    score += 15
    reasons.push({ text: 'High volatility: big swings both ways', tone: 'risk' })
  }
  const goal = user.goals.find((g) => g.id === user.activeGoalId)
  const plan = activePlan(goal, user)
  if (goal && (plan ? plan.months : goal.targetMonths) <= 12) {
    score += 10
    reasons.push({ text: `Doesn't strongly match your current goal (${goal.name}, needed soon)`, tone: 'risk' })
  }
  score = Math.max(0, Math.min(100, score))
  const level: FomoLevel = score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW'
  return { score, level, reasons }
}
