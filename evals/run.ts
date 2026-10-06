/**
 * Evals for Groww Dreams' decision logic. Run with:  npm run evals
 * Covers plan maths, Money Health, FOMO Check, agent routing, agent context
 * and financial-safety language. Pure functions only, so no browser needed.
 */
import { DEMO_USER } from '../src/data/demo.ts'
import type { User } from '../src/types.ts'
import { parseAmount } from '../src/lib/format.ts'
import { planOptions, remainingFor, monthlyMove, whatIf, upcomingMoves } from '../src/lib/plan.ts'
import { computeHealth, topPriority } from '../src/lib/health.ts'
import { fomoScore, goalImpact, TRENDING, TRENDING_ASSETS } from '../src/lib/fomo.ts'
import { agentReply, agentFollowUp, splitPlan, SUGGESTED_PROMPTS } from '../src/lib/agent.ts'
import { computeAfford } from '../src/lib/afford.ts'
import { HISTORIC_RETURNS, midpoint } from '../src/data/returns.ts'

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
check('fomo', '₹5,000 ≈ 1.3 months of the PS5 plan', goalImpact(5000, planned).text === '₹5,000 ≈ 1.3 months of your PS5 plan', goalImpact(5000, planned).text)
check('fomo', 'Without a plan the impact falls back to free money', goalImpact(8000, vidit).text === '₹8,000 ≈ 1 month of your free money', goalImpact(8000, vidit).text)
check('fomo', 'Flags mismatch with a short-term goal', fomoScore([], TRENDING, planned).reasons.some((r) => r.text.includes('PS5')))

/* 3b. More than one FOMO asset ------------------------------------------ */
const [, moon, gold] = TRENDING_ASSETS
const sameSignals = ['social', 'spike'] as const
check('fomo', 'Three assets to shield against: stock, token, steady pick', TRENDING_ASSETS.length === 3 && new Set(TRENDING_ASSETS.map((a) => a.id)).size === 3)
check('fomo', 'A steady low-volatility pick scores lower than a viral stock on the same answers',
  fomoScore([...sameSignals], gold, planned).score < fomoScore([...sameSignals], TRENDING, planned).score)
check('fomo', 'A 100%+ one-week jump adds its own warning', fomoScore([], moon, planned).reasons.some((r) => r.text.includes('112%')))
check('fomo', 'The same answers on the token score HIGH', fomoScore([...sameSignals], moon, planned).level === 'HIGH')

/* 3c. What-if and upcoming moves ---------------------------------------- */
const wi = whatIf(ps5, planned, 3920)
check('whatif', '₹3,920/mo → same date as the Save + Invest plan, investing intact', wi.date === planOptions(ps5, planned)[1].date && wi.toInvest === 3000 && wi.investCut === 0, JSON.stringify(wi))
check('whatif', 'Saving more per month finishes sooner and trims investing', whatIf(ps5, planned, 6000).months < wi.months && whatIf(ps5, planned, 6000).investCut > 0)
check('whatif', 'More than free money is flagged as a shortfall', whatIf(ps5, planned, 9000).shortfall === 1000)
check('whatif', 'Fun money never goes negative', whatIf(ps5, planned, 8000).flexible === 0)
const up = upcomingMoves(planned, false, 3)
check('upcoming', 'Three upcoming moves, balances only go up', up.length === 3 && up[0].balance < up[1].balance && up[1].balance < up[2].balance)
check('upcoming', 'First upcoming move (this month not yet done) already counts it', up[0].balance === 31500 + 2 * 3920, String(up[0].balance))
check('upcoming', 'After the monthly move, one fewer move is ahead', upcomingMoves(planned, true, 3)[0].balance === 31500 + 3920)
check('upcoming', 'Balance never passes the target', upcomingMoves({ ...planned, goals: [{ ...planned.goals[0], currentAmount: 54000 }] }, true, 3).every((m) => m.balance <= 55000))
check('upcoming', 'No plan locked → no upcoming moves', upcomingMoves(vidit, false).length === 0)

/* 3d. Historic returns data ------------------------------------------------ */
const byId = Object.fromEntries(HISTORIC_RETURNS.map((r) => [r.id, r]))
check('returns', 'Covers Nifty, equity, hybrid, REIT, FD and liquid funds', ['nifty', 'flexi', 'hybrid', 'reit', 'fd', 'liquid'].every((id) => byId[id]))
check('returns', 'Every row has a range, a date, a source and a plain-language note', HISTORIC_RETURNS.every((r) => r.low > 0 && r.low <= r.high && r.asOf && r.source && r.note.length > 40 && r.periods.length > 0))
check('returns', 'Nothing is a guarantee (no promise words)', HISTORIC_RETURNS.every((r) => !/guarantee|assured|will earn|sure/i.test(r.note + r.fit)))
check('returns', 'Risk and past return line up: FD and liquid sit below equity', midpoint(byId.fd) < midpoint(byId.nifty) && midpoint(byId.liquid) < midpoint(byId.fd))
check('returns', 'Steady options are labelled Low risk, equity is not', byId.fd.risk === 'Low' && byId.liquid.risk === 'Low' && byId.flexi.risk !== 'Low')
check('returns', 'The Nifty row carries the downside, not just the average', /fell/i.test(byId.nifty.note))

/* 4. Agent routing ---------------------------------------------------- */
const ctx = { user: planned, movedThisMonth: false }
const firstAction = (q: string) => agentReply(q, ctx).actions?.[0]?.id
const routes: [string, string][] = [
  ['I have ₹5,000 left this month', 'apply_split'],
  ['got a 10k bonus', 'apply_split'],
  ['Should I buy this iPhone on EMI?', 'emi_compare'],
  ['Can I afford an iPhone?', 'emi_compare'],
  ['can i afford a laptop for 70000', 'emi_compare'],
  ["Everyone's buying VoltEdge. Should I?", 'open_fomo'],
  ['which stock should I buy', 'open_fomo'],
  ['is crypto a good idea', 'open_fomo'],
  ['How am I doing?', 'open_health'],
  ["What's an SIP?", 'open_lesson'],
  ['when will I get my PS5', 'open_goal'],
  ['what are the nifty returns', 'open_returns'],
  ['FD or liquid fund for my PS5 money', 'open_returns'],
  ['asdfgh', 'ask'],
]
for (const [q, want] of routes) check('agent-routing', `"${q}" → ${want}`, firstAction(q) === want, String(firstAction(q)))

/* 5. Agent uses the user's context ----------------------------------- */
const split = agentReply('I have ₹5,000 left this month', ctx)
check('agent-context', 'Split mentions the active goal', split.text.includes('PS5') || !!split.lines?.some((l) => l.label === 'PS5'))
check('agent-context', 'Split lines add up to the amount asked about', split.lines!.reduce((s, l) => s + l.amount, 0) === 5000)
// Plan-aware: buffer first (lowest pillar), then the goal up to the locked plan's monthly, then investing.
const ps = splitPlan(5000, planned)
check('agent-context', 'Split follows the plan: buffer ₹1,000 → goal ₹3,920 → invest ₹80', ps.toBuffer === 1000 && ps.toGoal === 3920 && ps.toInvest === 80 && ps.flexible === 0, JSON.stringify(ps))
check('agent-context', 'Split never sends the goal more than the locked plan asks for', splitPlan(20000, planned).toGoal === 3920)
check('agent-context', 'Split never sends the goal more than it still needs', (() => { const u = withPlan(vidit, 'balanced'); u.goals[0].currentAmount = 54950; return splitPlan(5000, u).toGoal <= 50 })())
check('agent-context', 'Split lines match the numbers behind "Use this plan"', split.actions![0].payload!.toGoal === ps.toGoal && split.actions![0].payload!.toBuffer === ps.toBuffer)
const monthly = agentReply('what should I do this month', ctx)
const mvp = monthlyMove(planned)
check('agent-context', 'Monthly question shows exactly the Home move', monthly.lines!.find((l) => l.tone === 'goal')!.amount === mvp.toGoal && monthly.lines!.reduce((s, l) => s + l.amount, 0) === mvp.total)
check('agent-context', 'Monthly "Use this plan" applies the monthly move', monthly.actions![0].payload!.monthly === 1)
check('agent-context', '"Ahead" only after the monthly move is made',
  !split.text.includes('ahead') && agentReply('I have ₹5,000 left', { ...ctx, movedThisMonth: true }).text.includes('ahead'))
const iphoneUser = clone(planned); iphoneUser.goals[0].name = 'Goa trip'
check('agent-context', 'Changing the goal changes the reply', agentReply('I have 5000 left', { user: iphoneUser, movedThisMonth: false }).lines!.some((l) => l.label === 'Goa trip'))
const emi = agentReply('Should I buy this iPhone on EMI?', ctx)
check('agent-context', 'EMI reply quantifies impact on free money', /\d+%/.test(emi.text) && emi.text.includes('₹8,000'))
const cmp = agentFollowUp(emi.actions![0], ctx)!
check('agent-context', '"Show me the options" gives Option A, B and C', cmp.text.includes('Option A') && cmp.text.includes('Option B') && cmp.text.includes('Option C'))
check('agent-context', 'Compare opens the full "Can I afford it?" screen', cmp.actions![0].id === 'open_afford')

/* 5b. Can I afford it? (Buy vs Build) ------------------------------------ */
const aff = computeAfford(planned, 79_900, 12)
const [buy, build, later] = aff.options
check('afford', 'Three options: Buy now, Build first, Invest + wait', aff.options.map((o) => o.id).join() === 'buy,build,wait')
check('afford', '12-month EMI on ₹79,900 is ₹6,660/mo (83% of free money)', aff.emi === 6660 && buy.emiShare === 83, String(aff.emi))
check('afford', 'Buy now squeezes the goal date; Build first leaves it alone', buy.goalDate !== build.goalDate && build.goalDate === later.goalDate)
check('afford', 'Buy now cuts investing; the other two keep it', buy.investing < build.investing && build.investing === later.investing)
check('afford', 'Invest + wait grows investing after the goal', later.investingAfter > build.investingAfter)
check('afford', 'Build first gets you the item sooner than Invest + wait', build.ownDate !== later.ownDate)
check('afford', 'Only the EMI route carries an EMI share', build.emiShare === null && later.emiShare === null)
check('afford', 'Longer EMI lowers the monthly amount', computeAfford(planned, 79_900, 18).emi < aff.emi)
const emiUser = clone(planned); emiUser.emi = { item: 'iPhone', monthly: aff.emi, monthsLeft: 12 }
check('afford', 'Confirming an EMI lowers the Credit pillar and Money Health', computeHealth(emiUser).creditScore < computeHealth(planned).creditScore && computeHealth(emiUser).total < computeHealth(planned).total)
check('afford', 'EMI shows up in the monthly move and the total still equals free money', monthlyMove(emiUser).emi === aff.emi && monthlyMove(emiUser).total === emiUser.monthlyAvailable, String(monthlyMove(emiUser).total))
check('afford', 'EMI is paid before the goal is trimmed', monthlyMove(emiUser).toGoal < mv.toGoal && monthlyMove(emiUser).flexible === 0)

check('agent-context', 'Replies show what they drew on ("Based on")', split.basis!.length >= 3 && emi.basis!.some((b) => b.includes('Free money')))
check('agent-context', 'A split with nothing left says so', agentReply('I have ₹5,000 left this month', ctx).note!.includes('Nothing is left'))

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
