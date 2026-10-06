/**
 * Evals for Groww Dreams' decision logic. Run with:  npm run evals
 * Covers plan maths, Money Health, FOMO Check, agent routing, agent context
 * and financial-safety language. Pure functions only, so no browser needed.
 */
import { DEMO_USER } from '../src/data/demo.ts'
import type { User } from '../src/types.ts'
import { parseAmount } from '../src/lib/format.ts'
import { planOptions, remainingFor, monthlyMove } from '../src/lib/plan.ts'
import { computeHealth, topPriority } from '../src/lib/health.ts'
import { fomoScore, TRENDING } from '../src/lib/fomo.ts'
import { agentReply, agentFollowUp, SUGGESTED_PROMPTS } from '../src/lib/agent.ts'

let pass = 0, fail = 0
const results: string[] = []
function check(group: string, name: string, ok: boolean, detail = '') {
  ok ? pass++ : fail++
  results.push(`${ok ? '✅' : '❌'} [${group}] ${name}${!ok && detail ? `  → ${detail}` : ''}`)
}

const clone = (u: User): User => structuredClone(u)
const withPlan = (u: User, plan: 'save' | 'balanced' | 'wait'): User => {
  const x = clone(u)
  x.goals[0].plan = plan
  return x
}
const vidit = clone(DEMO_USER)
const ps5 = vidit.goals[0]

/* 1. Plan maths ------------------------------------------------------- */
const opts = planOptions(ps5, vidit)
const [save, balanced, wait] = opts
check('plan', 'SAVE needs ₹5,875/mo for 4 months (₹23,500 left)', save.toGoal === 5875 && save.months === 4, `${save.toGoal}/${save.months}`)
check('plan', 'SAVE + INVEST keeps ₹3,000 investing intact', balanced.toInvest === 3000 && balanced.toGoal === 3920, `${balanced.toGoal}/${balanced.toInvest}`)
check('plan', 'WAIT LONGER has the lowest monthly amount', wait.toGoal < balanced.toGoal && balanced.toGoal < save.toGoal)
check('plan', 'SAVE surfaces its trade-off (trims investing)', save.investCut > 0)
for (const o of opts) {
  check('plan', `${o.title}: monthly × months covers what's left`, o.toGoal * o.months >= remainingFor(ps5))
  check('plan', `${o.title}: goal + invest + flexible = free money`, o.toGoal + o.toInvest + o.flexible === vidit.monthlyAvailable)
}
const tight = clone(vidit); tight.monthlyAvailable = 4000
check('plan', 'Unaffordable plan is flagged with a shortfall', planOptions(tight.goals[0], tight)[0].shortfall > 0)
const done = clone(vidit); done.goals[0].currentAmount = 55000
check('plan', 'Funded goal needs ₹0/month', planOptions(done.goals[0], done).every((o) => o.toGoal === 0))
const mv = monthlyMove(withPlan(vidit, 'balanced'))
check('plan', "This month's move adds up to free money", mv.total === vidit.monthlyAvailable, String(mv.total))
// Simulate one monthly move the way the store does: money in, countdown ticks, clock advances.
for (const id of ['save', 'balanced', 'wait'] as const) {
  const before = withPlan(vidit, id)
  const p0 = planOptions(before.goals[0], before).find((o) => o.id === id)!
  const after = clone(before)
  after.monthsElapsed = 1
  after.goals[0].currentAmount += p0.toGoal
  after.goals[0].targetMonths -= 1
  const p1 = planOptions(after.goals[0], after).find((o) => o.id === id)!
  check('plan', `${p0.title}: locked plan stays steady after a monthly move`,
    Math.abs(p1.toGoal - p0.toGoal) <= 5 && p1.date === p0.date, `${p0.toGoal}@${p0.date} → ${p1.toGoal}@${p1.date}`)
}

/* 2. Money Health ----------------------------------------------------- */
const hBefore = computeHealth(vidit)
const hAfter = computeHealth(withPlan(vidit, 'balanced'))
check('health', 'Demo user scores 78/100 once the plan is locked', hAfter.total === 78, String(hAfter.total))
check('health', 'Locking a plan improves health', hAfter.total > hBefore.total, `${hBefore.total} → ${hAfter.total}`)
check('health', 'Pillars match brief (82/71/79/52/91)',
  [hAfter.savingScore, hAfter.investingScore, hAfter.creditScore, hAfter.emergencyScore, hAfter.goalScore].join('/') === '82/71/79/52/91',
  [hAfter.savingScore, hAfter.investingScore, hAfter.creditScore, hAfter.emergencyScore, hAfter.goalScore].join('/'))
check('health', 'Unplanned goal → priority is "plan your goal"', topPriority(vidit).key === 'goalScore')
check('health', 'Planned → ONE priority: emergency buffer', topPriority(withPlan(vidit, 'balanced')).key === 'emergencyScore')
check('health', 'Squeezing investing (SAVE) scores lower than balanced', computeHealth(withPlan(vidit, 'save')).total < hAfter.total)
const all = Object.values(hAfter).every((v) => v >= 0 && v <= 100)
check('health', 'All scores stay within 0–100', all)

/* 3. FOMO Check ------------------------------------------------------- */
const planned = withPlan(vidit, 'balanced')
check('fomo', 'Social + friend + price spike → HIGH', fomoScore(['social', 'friend', 'spike'], TRENDING, planned).level === 'HIGH')
check('fomo', 'Researched + fits plan → LOW', fomoScore(['research', 'plan'], TRENDING, planned).level === 'LOW')
check('fomo', 'Every risk reason is explained', fomoScore(['social', 'missout'], TRENDING, planned).reasons.length >= 3)
check('fomo', 'Flags mismatch with a short-term goal', fomoScore([], TRENDING, planned).reasons.some((r) => r.text.includes('PS5')))

/* 4. Agent routing ---------------------------------------------------- */
const ctx = { user: planned, movedThisMonth: false }
const firstAction = (q: string) => agentReply(q, ctx).actions?.[0]?.id
const routes: [string, string][] = [
  ['I have ₹5,000 left this month', 'apply_split'],
  ['got a 10k bonus', 'apply_split'],
  ['Should I buy this iPhone on EMI?', 'emi_compare'],
  ['can i afford a laptop for 70000', 'emi_compare'],
  ["Everyone's buying VoltEdge. Should I?", 'open_fomo'],
  ['which stock should I buy', 'open_fomo'],
  ['is crypto a good idea', 'open_fomo'],
  ['How am I doing?', 'open_health'],
  ["What's an SIP?", 'open_lesson'],
  ['when will I get my PS5', 'open_goal'],
  ['asdfgh', 'ask'],
]
for (const [q, want] of routes) check('agent-routing', `"${q}" → ${want}`, firstAction(q) === want, String(firstAction(q)))

/* 5. Agent uses the user's context ----------------------------------- */
const split = agentReply('I have ₹5,000 left this month', ctx)
check('agent-context', 'Split mentions the active goal', split.text.includes('PS5') || !!split.lines?.some((l) => l.label === 'PS5'))
check('agent-context', 'Split lines add up to the amount asked about', split.lines!.reduce((s, l) => s + l.amount, 0) === 5000)
check('agent-context', 'Split matches brief: ₹1,500 / ₹1,000 / ₹2,500', split.lines!.map((l) => l.amount).join('/') === '1500/1000/2500')
check('agent-context', '"Ahead" only after the monthly move is made',
  !split.text.includes('ahead') && agentReply('I have ₹5,000 left', { ...ctx, movedThisMonth: true }).text.includes('ahead'))
const iphoneUser = clone(planned); iphoneUser.goals[0].name = 'Goa trip'
check('agent-context', 'Changing the goal changes the reply', agentReply('I have 5000 left', { user: iphoneUser, movedThisMonth: false }).lines![0].label === 'Goa trip')
const emi = agentReply('Should I buy this iPhone on EMI?', ctx)
check('agent-context', 'EMI reply quantifies impact on free money', /\d+%/.test(emi.text) && emi.text.includes('₹8,000'))
const cmp = agentFollowUp(emi.actions![0], ctx)!
check('agent-context', '"Show both options" gives Option A and B', cmp.text.includes('Option A') && cmp.text.includes('Option B'))

/* 6. Financial safety -------------------------------------------------- */
const BANNED = /\bguaranteed\b|will double|you will (make|earn)|can'?t lose|risk[- ]free returns|buy now|definitely (go up|rise)|sure profit/i
const battery = [
  ...SUGGESTED_PROMPTS, ...routes.map((r) => r[0]),
  'guarantee me 20% returns', 'how do I double my money fast', 'is this sure shot', 'give me a stock tip',
  'should I put my PS5 money in stocks', 'I want to get rich quick', 'F&O trading?',
]
for (const q of battery) {
  const r = agentReply(q, ctx)
  const text = [r.text, r.note ?? '', ...(r.actions ?? []).map((a) => a.label)].join(' ')
  check('safety', `No promises/hype in reply to "${q}"`, !BANNED.test(text), text.match(BANNED)?.[0])
}
check('safety', 'Return-guarantee question gets an honest "no one can guarantee"', /nobody can guarantee/i.test(agentReply('guarantee me 20% returns', ctx).text))
check('safety', 'Agent never names a stock to buy', !/VOLTEDGE|buy .*shares/i.test(agentReply('which stock should I buy', ctx).text))

/* 7. Parsing ------------------------------------------------------------ */
const amounts: [string, number | null][] = [['₹5,000', 5000], ['5k', 5000], ['1.5 lakh', 150000], ['rs 800', 800], ['PS5', null], ['iPhone 15', null]]
for (const [s, n] of amounts) check('parse', `"${s}" → ${n}`, parseAmount(s) === n, String(parseAmount(s)))

/* ---------------------------------------------------------------------- */
console.log(results.join('\n'))
console.log(`\n${pass}/${pass + fail} evals passed`)
if (fail) process.exit(1)
