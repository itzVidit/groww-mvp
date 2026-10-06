export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export const inrShort = (n: number) => {
  if (n >= 1_00_00_000) return '₹' + +(n / 1_00_00_000).toFixed(1) + 'Cr'
  if (n >= 1_00_000) return '₹' + +(n / 1_00_000).toFixed(1) + 'L'
  if (n >= 1000) return '₹' + +(n / 1000).toFixed(1) + 'k'
  return inr(n)
}

export const monthLabel = (monthsFromNow: number, from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth() + monthsFromNow, 1)
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export const thisMonth = () => new Date().toLocaleDateString('en-IN', { month: 'long' })

export const pct = (part: number, whole: number) =>
  whole <= 0 ? 0 : Math.min(100, Math.max(0, (part / whole) * 100))

export const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n))

export const roundUp = (n: number, step = 10) => Math.ceil(n / step) * step
export const roundTo = (n: number, step = 100) => Math.round(n / step) * step

/** Pulls a money amount out of free text: "₹5,000", "5k", "1.5 lakh", "rs 800". */
export function parseAmount(text: string): number | null {
  const re = /(?<![a-z\d])(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|lakhs?|lacs?|l)?(?![a-z\d])/gi
  let best: number | null = null
  for (const m of text.matchAll(re)) {
    let n = parseFloat(m[1].replace(/,/g, ''))
    const unit = (m[2] || '').toLowerCase()
    if (unit === 'k') n *= 1000
    else if (unit.startsWith('l')) n *= 1_00_000
    if (n >= 500 && (best === null || n > best)) best = n
  }
  return best
}
