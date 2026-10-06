import type { Investment, User } from '../types.ts'

/** Hypothetical categories for learning. No live prices, no real products. */
export const INVESTMENTS: Investment[] = [
  {
    id: 'index',
    name: 'Nifty 50 Index Fund',
    category: 'Index Fund',
    emoji: '📈',
    risk: 'Medium',
    timeHorizon: '5+ years',
    description: "Owns India's 50 biggest companies in one go. No stock-picking needed.",
    whyFits: 'Low cost and simple. A common first step for long-term money.',
    downside: 'Falls when the whole market falls. Sometimes 20–30% in a bad year.',
  },
  {
    id: 'hybrid',
    name: 'Hybrid Mutual Fund',
    category: 'Mutual Fund',
    emoji: '⚖️',
    risk: 'Medium',
    timeHorizon: '3+ years',
    description: 'Mixes stocks and bonds. A fund manager adjusts the mix for you.',
    whyFits: 'Smoother ride than pure stocks if dips make you nervous.',
    downside: 'Higher fees than index funds, and it can still fall.',
  },
  {
    id: 'gold',
    name: 'Gold ETF',
    category: 'ETF',
    emoji: '🪙',
    risk: 'Medium',
    timeHorizon: '3+ years',
    description: 'Tracks the price of gold. Buy and sell it like a share.',
    whyFits: 'Often moves differently from stocks, which helps diversify.',
    downside: 'Needs a demat account. Gold can go sideways for years.',
  },
  {
    id: 'stock',
    name: 'Individual Stock',
    category: 'Stock',
    emoji: '🏢',
    risk: 'High',
    timeHorizon: '5+ years',
    description: 'Own a small piece of one company you understand.',
    whyFits: 'Lets you back a business you have actually researched.',
    downside: 'One company can fall a lot, or never recover.',
  },
]

/** One-line, personalised "how it fits you". Plain language, not advice. */
export function fitFor(inv: Investment, user: User): { label: string; tone: 'good' | 'ok' | 'careful' } {
  if (inv.risk === 'High' && (user.risk === 'low' || user.experience === 'none'))
    return { label: 'Maybe later', tone: 'careful' }
  if (inv.id === 'index') return { label: 'Good starting point', tone: 'good' }
  if (inv.id === 'hybrid' && user.risk === 'low') return { label: 'Fits your comfort', tone: 'good' }
  if (inv.risk === 'High') return { label: 'Small slice only', tone: 'careful' }
  return { label: 'Could fit', tone: 'ok' }
}
