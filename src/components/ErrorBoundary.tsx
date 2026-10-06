import { Component, type ReactNode } from 'react'

/** If a screen ever crashes, show a friendly reset instead of a white page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[dreams] screen crashed', error)
  }

  reset = () => {
    try { localStorage.removeItem('groww-dreams-v1') } catch { /* storage unavailable */ }
    location.hash = '#/welcome'
    location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex-1 grid place-items-center p-8 text-center" role="alert">
        <div>
          <div className="text-5xl">🛠️</div>
          <h1 className="font-display text-2xl font-semibold mt-4">Something went sideways</h1>
          <p className="text-ink-2 mt-2 text-[15px]">Your demo data is stored only in this browser. A fresh start usually fixes it.</p>
          <button onClick={this.reset} className="mt-6 h-12 px-6 rounded-2xl bg-ink text-white font-semibold">Restart demo</button>
        </div>
      </div>
    )
  }
}
