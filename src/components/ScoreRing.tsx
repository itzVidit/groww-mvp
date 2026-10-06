import { useEffect, useState } from 'react'

export function scoreTone(n: number) {
  if (n >= 75) return '#00B386'
  if (n >= 60) return '#F2A93B'
  return '#EF5B4C'
}

/** Animated circular score. */
export function ScoreRing({ value, size = 120, stroke = 10, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(value))
    return () => cancelAnimationFrame(t)
  }, [value])
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(11,15,20,.07)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={scoreTone(value)} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display font-semibold num leading-none" style={{ fontSize: size * 0.3 }}>{value}</div>
          {label && <div className="text-[10px] text-ink-3 font-medium mt-1">{label}</div>}
        </div>
      </div>
    </div>
  )
}
