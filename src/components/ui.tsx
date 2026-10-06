import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BackIcon, CloseIcon } from './Icons'

/* ------------------------------ Button ------------------------------ */
type Variant = 'primary' | 'dark' | 'ghost' | 'soft'
export function Button({
  variant = 'primary', className = '', children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary: 'bg-mint text-white hover:bg-mint-dark shadow-[0_6px_20px_-6px_rgba(0,179,134,.6)]',
    dark: 'bg-ink text-white hover:bg-ink-2',
    ghost: 'bg-transparent text-ink-2 hover:bg-ink/5',
    soft: 'bg-ink/[0.05] text-ink hover:bg-ink/[0.08]',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 h-12 text-[15px] font-semibold transition active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------------------------- ProgressBar --------------------------- */
export function ProgressBar({ value, tone = 'mint', height = 8, className = '' }: {
  value: number; tone?: 'mint' | 'amber' | 'coral' | 'violet' | 'ink'; height?: number; className?: string
}) {
  const color = { mint: 'bg-mint', amber: 'bg-amber', coral: 'bg-coral', violet: 'bg-violet', ink: 'bg-ink' }[tone]
  return (
    <div className={`w-full rounded-full bg-ink/[0.07] overflow-hidden ${className}`} style={{ height }}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-700 ease-out`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  )
}

/* ---------------------------- SplitBar ------------------------------ */
export const SPLIT_COLORS = {
  goal: 'bg-mint', invest: 'bg-violet', buffer: 'bg-amber', flex: 'bg-ink/15', warn: 'bg-coral',
} as const
export function SplitBar({ parts, height = 10 }: { parts: { value: number; tone: keyof typeof SPLIT_COLORS }[]; height?: number }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  return (
    <div className="flex w-full gap-[3px] rounded-full overflow-hidden" style={{ height }}>
      {parts.filter((p) => p.value > 0).map((p, i) => (
        <div key={i} className={`${SPLIT_COLORS[p.tone]} transition-all duration-500`} style={{ width: `${(p.value / total) * 100}%` }} />
      ))}
    </div>
  )
}

/* ------------------------------- Sheet ------------------------------ */
export function Sheet({ open, onClose, children, title, tall = false }: {
  open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; tall?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  // Portal to the phone frame so sheets cover the whole screen (incl. nav),
  // not just the scrolling page they were opened from.
  const root = document.getElementById('sheet-root')
  const sheet = (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/45 animate-fade" onClick={onClose} />
      <div className={`relative bg-paper rounded-t-[28px] animate-sheet flex flex-col ${tall ? 'h-[92%]' : 'max-h-[90%]'}`}>
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="w-8" />
          <div className="h-1.5 w-10 rounded-full bg-ink/15" />
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full hover:bg-ink/5 text-ink-3" aria-label="Close">
            <CloseIcon width={18} height={18} />
          </button>
        </div>
        {title && <div className="px-5 pb-2 font-display text-xl font-semibold">{title}</div>}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-safe">{children}</div>
      </div>
    </div>
  )
  return root ? createPortal(sheet, root) : sheet
}

/* ---------------------------- PageHeader ---------------------------- */
export function PageHeader({ title, back, right }: { title?: ReactNode; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="sticky top-0 z-20 bg-paper px-5 pt-4 pb-3 flex items-center gap-3">
      {back && (
        <button
          onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
          className="-ml-2 w-9 h-9 grid place-items-center rounded-full hover:bg-ink/5"
          aria-label="Back"
        >
          <BackIcon />
        </button>
      )}
      <div className="font-display text-lg font-semibold flex-1 truncate">{title}</div>
      {right}
    </div>
  )
}

/* ------------------------------ Bits -------------------------------- */
export function Pill({ children, tone = 'ink', className = '' }: { children: ReactNode; tone?: 'ink' | 'mint' | 'amber' | 'coral' | 'violet'; className?: string }) {
  const t = {
    ink: 'bg-ink/[0.06] text-ink-2',
    mint: 'bg-mint-soft text-mint-dark',
    amber: 'bg-amber-soft text-[#9A6412]',
    coral: 'bg-coral-soft text-[#B23A2E]',
    violet: 'bg-violet-soft text-violet',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${t} ${className}`}>{children}</span>
}

export function Disclaimer({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-ink-3 ${className}`}>
      {children ?? 'Illustrative & hypothetical. This is a product demo, not investment advice. Investments can go down as well as up.'}
    </p>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3 mt-7">
      <h2 className="font-display text-[17px] font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}
