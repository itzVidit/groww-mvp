/**
 * Historic returns, side by side. Category-level and rounded, from public AMC
 * factsheets, index-provider data and bank rate cards (mid-2026). Individual funds
 * differ, and past returns never predict future ones. Refresh before you quote it.
 */
export interface HistoricReturn {
  id: string
  name: string
  emoji: string
  kind: 'Equity' | 'Hybrid' | 'REIT' | 'Debt' | 'Bank'
  risk: 'Low' | 'Medium' | 'High'
  /** The long-run per-year figure the bar is drawn from (the middle of its range). */
  low: number
  high: number
  /** What the range is made of, shown as chips: "10Y 12.5%". */
  periods: { k: string; v: string }[]
  /** Plain-language context: what drives it, what can go wrong. */
  note: string
  /** Where goal money vs long-term money fits. */
  fit: string
  asOf: string
  source: string
}

export const HISTORIC_RETURNS: HistoricReturn[] = [
  {
    id: 'nifty', name: 'Nifty 50 (total return)', emoji: '📈', kind: 'Equity', risk: 'Medium',
    low: 9.9, high: 12.5,
    periods: [{ k: '5Y', v: '9.9%' }, { k: '10Y', v: '12.5%' }, { k: '15Y', v: '11.4%' }],
    note: 'The 50 biggest listed companies, dividends included. The average hides the ride: it fell about 38% in March 2020 and about 60% in 2008, then recovered.',
    fit: 'Long-term money, 5+ years.',
    asOf: '31 May 2026', source: 'Index fund factsheet (Axis AMC)',
  },
  {
    id: 'flexi', name: 'Flexi-cap equity funds', emoji: '🧩', kind: 'Equity', risk: 'High',
    low: 11.5, high: 12.5,
    periods: [{ k: '5Y avg', v: '11.5–12.5%' }, { k: '10Y, top funds', v: '14–19%' }],
    note: 'Fund managers pick across large, mid and small companies. The 10Y figure is for the best funds, which is flattering: many funds in the category did worse, and next decade\'s leaders are unknown.',
    fit: 'Long-term money, 7+ years.',
    asOf: 'May–Sep 2026', source: 'AMC factsheets, category data',
  },
  {
    id: 'hybrid', name: 'Aggressive hybrid funds', emoji: '⚖️', kind: 'Hybrid', risk: 'Medium',
    low: 10.4, high: 12.2,
    periods: [{ k: '5Y', v: '9.6–12.3%' }, { k: '10Y', v: '10.4–12.2%' }],
    note: 'Roughly two-thirds stocks and one-third bonds. Has tended to fall less than pure equity in bad years, and has trailed it in strong ones.',
    fit: 'Medium-term money, 3–5+ years, if dips make you nervous.',
    asOf: 'Jun–Sep 2026', source: 'Four large funds, AMC product notes',
  },
  {
    id: 'reit', name: 'Listed REITs (office)', emoji: '🏢', kind: 'REIT', risk: 'Medium',
    low: 7.4, high: 8.0,
    periods: [{ k: 'Since listing', v: '7.4–8.0%' }, { k: 'Rent payout', v: '6.8–8.0%' }],
    note: 'Most of the return is rent paid out to you, not price growth. Units trade like shares, so prices still move, and they are young: 4 to 7 years of history.',
    fit: 'Income-style money, 5+ years.',
    asOf: 'Aug 2026', source: 'Three large listed office REITs',
  },
  {
    id: 'fd', name: 'Bank fixed deposit', emoji: '🏦', kind: 'Bank', risk: 'Low',
    low: 6.6, high: 7.0,
    periods: [{ k: '1–3Y rate', v: '6.6–7.0%' }],
    note: 'A fixed rate you know up front, not a historic return. Interest is taxed at your slab, so what you keep is lower.',
    fit: 'Goal money you need within a year or two.',
    asOf: 'Early 2026 rate cards', source: 'Large public and private bank rate cards',
  },
  {
    id: 'liquid', name: 'Liquid funds', emoji: '💧', kind: 'Debt', risk: 'Low',
    low: 5.5, high: 5.9,
    periods: [{ k: '5Y', v: '5.5–5.9%' }, { k: '1Y', v: '~6.3%' }],
    note: 'Parks money in very short-term debt. Steady and easy to withdraw, but unlike an FD the rate is not fixed, and returns drift with interest rates.',
    fit: 'Goal money and emergency buffers.',
    asOf: 'Mid 2026', source: 'Category data from fund trackers',
  },
]

export const RETURNS_DISCLAIMER =
  'Past returns are not a promise. Figures are rounded, category-level and from public sources as of mid-2026, and individual funds differ. Dreams plans still assume 0% on goal money, so no date here depends on them.'

export const midpoint = (r: HistoricReturn) => Math.round(((r.low + r.high) / 2) * 10) / 10
export const rangeLabel = (r: HistoricReturn) => (r.low === r.high ? `${r.low}%` : `${r.low}–${r.high}%`)
