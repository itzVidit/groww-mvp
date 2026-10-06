import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * Layout mode, driven by the `type` URL param:
 *   ?type=mobile   phone-first UI (framed on big screens)
 *   ?type=windows  desktop web UI (top nav, multi-column pages)
 * Works as `/?type=windows#/home` or `/#/home?type=windows`. The choice is kept
 * for the browser session so in-app navigation (which rewrites the hash) keeps it.
 * No param → auto: web layout on wide screens, mobile otherwise.
 */
export type LayoutMode = 'mobile' | 'windows'

const KEY = 'groww-dreams:layout'
const ALIASES = new Map<string, LayoutMode>([
  ['mobile', 'mobile'], ['phone', 'mobile'],
  ['windows', 'windows'], ['desktop', 'windows'], ['web', 'windows'],
])

function parse(v: string | null): LayoutMode | null {
  return (v && ALIASES.get(v.toLowerCase())) || null
}

function fromUrl(): LayoutMode | null {
  const { search, hash } = window.location
  const q = hash.indexOf('?')
  return parse(new URLSearchParams(search).get('type')) ?? (q >= 0 ? parse(new URLSearchParams(hash.slice(q + 1)).get('type')) : null)
}

function stored(): LayoutMode | null {
  try { return parse(sessionStorage.getItem(KEY)) } catch { return null }
}

const WIDE = '(min-width: 1024px)'

const Ctx = createContext<{ mode: LayoutMode; web: boolean }>({ mode: 'mobile', web: false })

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [explicit, setExplicit] = useState<LayoutMode | null>(() => fromUrl() ?? stored())
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches)

  useEffect(() => {
    const sync = () => {
      const m = fromUrl()
      if (!m) return
      setExplicit(m)
      try { sessionStorage.setItem(KEY, m) } catch { /* private mode */ }
    }
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync) }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia(WIDE)
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const mode: LayoutMode = explicit ?? (wide ? 'windows' : 'mobile')
  useEffect(() => { document.documentElement.dataset.layout = mode }, [mode])

  return <Ctx.Provider value={{ mode, web: mode === 'windows' }}>{children}</Ctx.Provider>
}

export const useLayout = () => useContext(Ctx)
