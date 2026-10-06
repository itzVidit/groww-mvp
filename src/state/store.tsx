import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import type { Goal, PlanId, User, XpEvent } from '../types'
import { DEMO_STREAK, DEMO_USER, DEMO_XP, demoXpLog } from '../data/demo'
import { computeHealth } from '../lib/health'
import { monthlyMove, planOptions } from '../lib/plan'

export interface AppState {
  onboarded: boolean
  user: User
  xp: number
  streak: number
  xpLog: XpEvent[]
  completedLessons: string[]
  movedThisMonth: boolean
  /** Health score when onboarding finished, so we can show "+N since you started". */
  startHealth: number | null
  rewarded: string[]
  toast: { id: number; text: string; xp?: number } | null
}

export type Action =
  | { type: 'COMPLETE_ONBOARDING'; user: User }
  | { type: 'SET_PLAN'; goalId: string; plan: PlanId; months: number }
  | { type: 'MAKE_MOVE' }
  | { type: 'ADD_TO_GOAL'; amount: number; label: string }
  | { type: 'ADD_GOAL'; goal: Goal; activate?: boolean }
  | { type: 'SET_ACTIVE_GOAL'; goalId: string }
  | { type: 'START_BUFFER'; monthly: number }
  | { type: 'COMPLETE_LESSON'; id: string; title: string }
  | { type: 'REWARD_ONCE'; key: string; xp: number; label: string }
  | { type: 'TOAST'; text: string }
  | { type: 'CLEAR_TOAST' }
  | { type: 'RESET' }

const STORAGE_KEY = 'groww-dreams-v1'

const initialState = (): AppState => ({
  onboarded: false,
  user: structuredClone(DEMO_USER),
  xp: DEMO_XP,
  streak: DEMO_STREAK,
  xpLog: demoXpLog(),
  completedLessons: [],
  movedThisMonth: false,
  startHealth: null,
  rewarded: [],
  toast: null,
})

let toastSeq = 0
function award(s: AppState, xp: number, label: string): AppState {
  return {
    ...s,
    xp: s.xp + xp,
    xpLog: [{ id: 'x' + Date.now() + toastSeq, label, xp, at: Date.now() }, ...s.xpLog],
    toast: { id: ++toastSeq, text: label, xp },
  }
}

const mapGoals = (u: User, fn: (g: Goal) => Goal): User => ({ ...u, goals: u.goals.map(fn) })

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'COMPLETE_ONBOARDING':
      return { ...initialState(), onboarded: true, user: a.user, startHealth: computeHealth(a.user).total }

    case 'SET_PLAN': {
      const goal = s.user.goals.find((g) => g.id === a.goalId)
      if (!goal) return s
      const opt = planOptions({ ...goal, targetMonths: a.months }, s.user).find((p) => p.id === a.plan)!
      const user = mapGoals(s.user, (g) =>
        g.id === a.goalId ? { ...g, plan: a.plan, targetMonths: a.months, monthlyContribution: opt.toGoal } : g,
      )
      const before = computeHealth(s.user).total
      const after = computeHealth(user).total
      const first = !goal.plan
      let next: AppState = { ...s, user }
      if (first) next = award(next, 30, `Plan locked for ${goal.name}`)
      const delta = after - before
      if (delta > 0) next = { ...next, toast: { id: ++toastSeq, text: `Plan locked · Money Health +${delta}`, xp: first ? 30 : undefined } }
      return next
    }

    case 'MAKE_MOVE': {
      if (s.movedThisMonth) return s
      const move = monthlyMove(s.user)
      // One simulated month passes: money lands in goals and the countdown ticks.
      const user = mapGoals({ ...s.user, monthsElapsed: (s.user.monthsElapsed ?? 0) + 1 }, (g) => {
        if (g.id === s.user.activeGoalId)
          return { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + move.toGoal), targetMonths: Math.max(1, g.targetMonths - 1) }
        if (g.kind === 'buffer') return { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + move.toBuffer) }
        return g
      })
      let next: AppState = { ...s, user, movedThisMonth: true, streak: s.streak + 1 }
      next = award(next, 40, 'Stayed within goal budget')
      if (move.toInvest > 0) next = award(next, 50, 'Invested this month')
      return { ...next, toast: { id: ++toastSeq, text: "This month's move is done", xp: move.toInvest > 0 ? 90 : 40 } }
    }

    case 'ADD_TO_GOAL': {
      const user = mapGoals(s.user, (g) =>
        g.id === s.user.activeGoalId ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + a.amount) } : g,
      )
      return award({ ...s, user }, 30, a.label)
    }

    case 'ADD_GOAL': {
      const user = { ...s.user, goals: [...s.user.goals, a.goal], activeGoalId: a.activate ? a.goal.id : s.user.activeGoalId }
      return { ...s, user, toast: { id: ++toastSeq, text: `${a.goal.emoji} ${a.goal.name} added to your goals` } }
    }

    case 'SET_ACTIVE_GOAL':
      return { ...s, user: { ...s.user, activeGoalId: a.goalId } }

    case 'START_BUFFER': {
      if (s.user.goals.some((g) => g.kind === 'buffer')) return s
      const buffer: Goal = {
        id: 'buffer', kind: 'buffer', name: 'Emergency buffer', emoji: '🛟',
        targetAmount: 5000, currentAmount: 0, targetMonths: Math.ceil(5000 / a.monthly),
        monthlyContribution: a.monthly, plan: 'save',
      }
      return award({ ...s, user: { ...s.user, goals: [...s.user.goals, buffer] } }, 30, 'Started an emergency buffer')
    }

    case 'COMPLETE_LESSON':
      if (s.completedLessons.includes(a.id)) return s
      return award({ ...s, completedLessons: [...s.completedLessons, a.id] }, 20, `Money Minute: ${a.title}`)

    case 'REWARD_ONCE':
      if (s.rewarded.includes(a.key)) return s
      return award({ ...s, rewarded: [...s.rewarded, a.key] }, a.xp, a.label)

    case 'TOAST':
      return { ...s, toast: { id: ++toastSeq, text: a.text } }

    case 'CLEAR_TOAST':
      return { ...s, toast: null }

    case 'RESET':
      return initialState()
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initialState(), ...JSON.parse(raw), toast: null }
  } catch {
    /* storage unavailable: start fresh */
  }
  return initialState()
}

const Ctx = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, toast: null }))
    } catch {
      /* ignore */
    }
  }, [state])
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}

/** Convenience selectors used across screens. */
export function useDerived() {
  const { state } = useApp()
  return useMemo(() => {
    const user = state.user
    const goal = user.goals.find((g) => g.id === user.activeGoalId)
    const health = computeHealth(user)
    return { user, goal, health, move: monthlyMove(user) }
  }, [state.user])
}
