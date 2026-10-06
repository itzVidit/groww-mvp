import { createContext, useContext, useMemo, type ReactNode } from 'react'

/**
 * Everything Groww Dreams needs from the host app, in one place.
 * Standalone, the defaults below simulate it. Inside the Groww app, pass real
 * implementations to <DreamsApp host={...} /> and nothing else has to change.
 */
export interface HostAdapter {
  /** Analytics. Called with stable snake_case event names (see docs/INTEGRATION.md). */
  trackEvent(name: string, props?: Record<string, string | number | boolean>): void
  /** Hand off to Groww's real product page / order flow (fund, ETF, stock, FD). */
  openProduct(product: { id: string; category: string; name: string }): void
  /** Hand off to Groww's real SIP / payment flow for this month's move. */
  startSip(plan: { goalId: string; goalName: string; monthlyAmount: number; investAmount: number }): void
}

const standalone: HostAdapter = {
  trackEvent: (name, props) => console.debug('[dreams:event]', name, props ?? {}),
  openProduct: (p) => console.debug('[dreams:openProduct]', p),
  startSip: (p) => console.debug('[dreams:startSip]', p),
}

const Ctx = createContext<HostAdapter>(standalone)

export function HostProvider({ host, children }: { host?: Partial<HostAdapter>; children: ReactNode }) {
  const value = useMemo<HostAdapter>(() => ({ ...standalone, ...host }), [host])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useHost = () => useContext(Ctx)
