import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p,
})

export const HomeIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h5v-6h4v6h5V9.5" /></svg>
)
export const GoalIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /></svg>
)
export const InvestIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
)
export const MoneyIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 21s-7.5-4.6-9.2-9.4C1.6 8 4 4.5 7.5 4.5c2 0 3.4 1.1 4.5 2.6 1.1-1.5 2.5-2.6 4.5-2.6 3.5 0 5.9 3.5 4.7 7.1C19.5 16.4 12 21 12 21Z" /></svg>
)
export const SparkIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M12 8.5 13.2 11l2.3 1-2.3 1L12 15.5 10.8 13 8.5 12l2.3-1Z" fill="currentColor" stroke="none" /></svg>
)
export const BackIcon = (p: P) => (
  <svg {...base(p)}><path d="M15 5l-7 7 7 7" /></svg>
)
export const ChevronIcon = (p: P) => (
  <svg {...base(p)}><path d="M9 5l7 7-7 7" /></svg>
)
export const CloseIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const SendIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)
export const PlusIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const ShieldIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6Z" /></svg>
)
export const FlameIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.9 3.3-5.6 3.8-9.8 2.7 1.6 4.3 4 4.4 6.4 1-.6 1.7-1.7 1.9-3 1.7 1.6 2.9 3.9 2.9 6.4 0 3.6-2.6 6.2-6.5 6.2Z" /></svg>
)
