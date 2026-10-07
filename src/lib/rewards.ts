/**
 * Tiers and streak rewards. XP rewards good habits (saving, learning, pausing), never trading volume,
 * so perks are things that lower the cost of investing, not things that push you to trade more.
 */
export interface Tier {
  id: string
  name: string
  emoji: string
  minXp: number
  perks: string[]
}

export const TIERS: Tier[] = [
  { id: 'seed',    name: 'Seed',    emoji: '🌱', minXp: 0,    perks: ['Money Minute lessons', 'Can I afford it? checks'] },
  { id: 'saver',   name: 'Saver',   emoji: '🪙', minXp: 200,  perks: ['Monthly goal report card', '1 streak freeze a month'] },
  { id: 'builder', name: 'Builder', emoji: '🧱', minXp: 500,  perks: ['Zero brokerage on 5 orders a month', '2 streak freezes a month'] },
  { id: 'investor',name: 'Investor',emoji: '📈', minXp: 1000, perks: ['Zero brokerage on 15 orders a month', 'Priority support'] },
  { id: 'legend',  name: 'Legend',  emoji: '👑', minXp: 2000, perks: ['Zero brokerage on all delivery orders', 'Early access to new features'] },
]

export interface StreakReward {
  id: string
  days: number
  title: string
  detail: string
  kind: 'coupon' | 'brokerage' | 'freeze' | 'cashback'
}

export const STREAK_REWARDS: StreakReward[] = [
  { id: 's7',   days: 7,   title: 'Streak freeze',          detail: 'Miss one month without losing your streak.',      kind: 'freeze' },
  { id: 's14',  days: 14,  title: '₹0 brokerage on 3 orders', detail: 'Valid for 30 days on delivery orders.',           kind: 'brokerage' },
  { id: 's30',  days: 30,  title: '₹100 gift voucher',      detail: 'Pick from partner coupons after claiming.',        kind: 'coupon' },
  { id: 's60',  days: 60,  title: '₹0 brokerage on 10 orders', detail: 'Valid for 60 days on delivery orders.',          kind: 'brokerage' },
  { id: 's100', days: 100, title: '₹250 SIP bonus',         detail: 'Added to your goal once your next SIP runs.',       kind: 'cashback' },
]

export const KIND_EMOJI: Record<StreakReward['kind'], string> = { coupon: '🎟️', brokerage: '🏷️', freeze: '🧊', cashback: '💸' }

export function tierFor(xp: number): { tier: Tier; next: Tier | null; pct: number; toNext: number } {
  let i = 0
  TIERS.forEach((t, idx) => { if (xp >= t.minXp) i = idx })
  const tier = TIERS[i]
  const next = TIERS[i + 1] ?? null
  const pct = next ? Math.round(((xp - tier.minXp) / (next.minXp - tier.minXp)) * 100) : 100
  return { tier, next, pct, toNext: next ? next.minXp - xp : 0 }
}

export function nextStreakReward(streak: number): StreakReward | null {
  return STREAK_REWARDS.find((r) => r.days > streak) ?? null
}
