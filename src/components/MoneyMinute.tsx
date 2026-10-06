import { useState } from 'react'
import { LESSONS, type Lesson, type LessonVisual } from '../data/lessons'
import { useApp } from '../state/store'
import { Button, Sheet } from './ui'
import { CheckIcon } from './Icons'

export function MoneyMinuteCard({ lesson, done, onOpen }: { lesson: Lesson; done: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="shrink-0 w-[150px] h-[176px] snap-start text-left rounded-3xl p-4 bg-paper-card border border-paper-line shadow-card flex flex-col hover:-translate-y-0.5 transition">
      <div className="flex items-center justify-between">
        <span className="text-[26px] leading-none">{lesson.emoji}</span>
        {done ? (
          <span className="w-5 h-5 rounded-full bg-mint grid place-items-center"><CheckIcon width={12} height={12} className="text-white" strokeWidth={3} /></span>
        ) : (
          <span className="text-[11px] font-semibold text-ink-3">{lesson.seconds}s</span>
        )}
      </div>
      <div className="mt-auto font-semibold text-[15px] leading-snug">{lesson.title}</div>
      <div className="text-[11px] text-ink-3 mt-1">{done ? 'Completed' : '+20 XP'}</div>
    </button>
  )
}

export function MoneyMinuteRow() {
  const { state } = useApp()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <div className="-mx-5 px-5 flex gap-3 overflow-x-auto no-scrollbar snap-x pb-1">
        {LESSONS.map((l) => (
          <MoneyMinuteCard key={l.id} lesson={l} done={state.completedLessons.includes(l.id)} onOpen={() => setOpen(l.id)} />
        ))}
      </div>
      <LessonSheet lessonId={open} onClose={() => setOpen(null)} />
    </>
  )
}

export function LessonSheet({ lessonId, onClose }: { lessonId: string | null; onClose: () => void }) {
  const { dispatch } = useApp()
  const [step, setStep] = useState(0)
  const lesson = LESSONS.find((l) => l.id === lessonId)
  const close = () => { setStep(0); onClose() }
  if (!lesson) return null

  const finish = () => {
    dispatch({ type: 'COMPLETE_LESSON', id: lesson.id, title: lesson.title })
    close()
  }

  const titles = ['The hook', 'In plain words', 'See it', 'Remember this']
  return (
    <Sheet open onClose={close}>
      <div className="flex gap-1.5 mb-5">
        {titles.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-ink' : 'bg-ink/10'}`} />
        ))}
      </div>
      <div className="label">{lesson.emoji} Money Minute · {titles[step]}</div>
      <div key={step} className="min-h-[260px] mt-3 animate-rise">
        {step === 0 && <p className="font-display text-[26px] leading-tight font-semibold tracking-tight">{lesson.hook}</p>}
        {step === 1 && (
          <>
            <h3 className="font-display text-xl font-semibold">{lesson.title}</h3>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{lesson.explain}</p>
          </>
        )}
        {step === 2 && (
          <>
            <div className="card p-4"><LessonViz kind={lesson.visual} /></div>
            <p className="mt-3 text-[12.5px] text-ink-3 leading-relaxed">{lesson.visualCaption}</p>
          </>
        )}
        {step === 3 && (
          <div className="rounded-3xl bg-ink text-white p-6">
            <div className="text-[12px] uppercase tracking-widest text-white/50 font-semibold">One takeaway</div>
            <p className="font-display text-[28px] leading-tight font-semibold mt-3">{lesson.takeaway}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        {step > 0 && <Button variant="soft" onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 3 ? (
          <Button className="flex-1" variant="dark" onClick={() => setStep(step + 1)}>Next</Button>
        ) : (
          <Button className="flex-1" onClick={finish}>Got it · +20 XP</Button>
        )}
      </div>
    </Sheet>
  )
}

/* --------------------------- tiny visuals --------------------------- */
function LessonViz({ kind }: { kind: LessonVisual }) {
  const W = 300, H = 150
  if (kind === 'sip') {
    const prices = [100, 92, 85, 90, 104, 98, 88, 95, 110, 105, 118, 112]
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {prices.map((p, i) => {
          const units = 1000 / p
          const h = units * 9
          return (
            <g key={i}>
              <rect x={10 + i * 24} y={H - 20 - h} width={14} height={h} rx={4} fill="#00B386" opacity={0.25 + (units - 8) * 0.25} />
              <text x={17 + i * 24} y={H - 6} textAnchor="middle" fontSize="8" fill="#7A8494">{'JFMAMJJASOND'[i]}</text>
            </g>
          )
        })}
        <text x={10} y={14} fontSize="10" fill="#3A4250" fontWeight="600">Units bought each month (₹1,000 each)</text>
      </svg>
    )
  }
  if (kind === 'fall') {
    const pts = [60, 70, 55, 75, 85, 62, 80, 95, 88, 70, 92, 105, 98, 115, 108, 125]
    const d = pts.map((v, i) => `${i ? 'L' : 'M'}${10 + i * 18.5},${H - 10 - v}`).join(' ')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path d={d} fill="none" stroke="#00B386" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {[2, 5, 9].map((i) => <circle key={i} cx={10 + i * 18.5} cy={H - 10 - pts[i]} r="5" fill="#EF5B4C" />)}
        <text x={10} y={14} fontSize="10" fill="#3A4250" fontWeight="600">Dips (red) are normal along the way</text>
      </svg>
    )
  }
  if (kind === 'diversify') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <circle cx={70} cy={80} r={42} fill="#EF5B4C" opacity=".9" />
        <text x={70} y={84} textAnchor="middle" fontSize="11" fill="white" fontWeight="700">1 bet</text>
        <text x={70} y={140} textAnchor="middle" fontSize="10" fill="#7A8494">One falls → you fall</text>
        {Array.from({ length: 25 }).map((_, i) => (
          <circle key={i} cx={175 + (i % 5) * 22} cy={38 + Math.floor(i / 5) * 20} r="8" fill={i === 7 ? '#EF5B4C' : '#00B386'} opacity={i === 7 ? 1 : 0.75} />
        ))}
        <text x={219} y={140} textAnchor="middle" fontSize="10" fill="#7A8494">One falls → barely felt</text>
      </svg>
    )
  }
  if (kind === 'compound') {
    let value = 0
    const bars = Array.from({ length: 10 }).map((_, y) => {
      value = value * 1.1 + 12000 * 1.05
      return { invested: 12000 * (y + 1), value }
    })
    const max = bars[9].value
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {bars.map((b, i) => {
          const hv = (b.value / max) * 110, hi = (b.invested / max) * 110
          return (
            <g key={i}>
              <rect x={14 + i * 28} y={H - 20 - hv} width={18} height={hv} rx={4} fill="#00B386" />
              <rect x={14 + i * 28} y={H - 20 - hi} width={18} height={hi} rx={4} fill="#0B0F14" opacity=".18" />
              <text x={23 + i * 28} y={H - 6} textAnchor="middle" fontSize="8" fill="#7A8494">Y{i + 1}</text>
            </g>
          )
        })}
        <text x={10} y={14} fontSize="10" fill="#3A4250" fontWeight="600">Grey: you put in · Green: illustrative value</text>
      </svg>
    )
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <path d={`M14,${H - 40} L${W - 14},${H - 72}`} stroke="#6E5BEF" strokeWidth="3" strokeLinecap="round" />
      <path d={`M14,${H - 40} C80,${H - 110} 120,${H - 10} 170,${H - 80} S250,${H - 30} ${W - 14},${H - 100}`} stroke="#B4BCC8" strokeWidth="2" fill="none" strokeDasharray="4 5" />
      <text x={W - 14} y={H - 60} textAnchor="end" fontSize="10" fill="#6E5BEF" fontWeight="700">FD: steady</text>
      <text x={W - 14} y={H - 108} textAnchor="end" fontSize="10" fill="#7A8494">Stocks: bumpy</text>
      <text x={10} y={14} fontSize="10" fill="#3A4250" fontWeight="600">Predictable vs. unpredictable</text>
    </svg>
  )
}
