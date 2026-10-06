import { useEffect } from 'react'
import { useApp } from '../state/store'
import { useLayout } from '../lib/layout'

export function Toast() {
  const { state, dispatch } = useApp()
  const t = state.toast
  const { web } = useLayout()
  useEffect(() => {
    if (!t) return
    const h = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2600)
    return () => clearTimeout(h)
  }, [t, dispatch])
  if (!t) return null
  return (
    <div key={t.id} className={`${web ? 'fixed top-20' : 'absolute top-4'} left-1/2 z-50 animate-pop`} role="status">
      <div className="flex items-center gap-2.5 bg-ink text-white rounded-full pl-4 pr-2 py-2 shadow-lift whitespace-nowrap text-sm font-medium">
        <span>{t.text}</span>
        {t.xp ? <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-bold">+{t.xp} XP</span> : <span className="w-1" />}
      </div>
    </div>
  )
}
