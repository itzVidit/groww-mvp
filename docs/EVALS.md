# Evals

Two layers: **automated logic evals** (`npm run evals`, 122 checks) and a **manual UX script** run in the browser.

## 1. Automated (`evals/run.ts`)

All product decisions live in pure functions (`src/lib/*`), so they can be tested without a UI.

| Area | What's checked | Why it matters |
|---|---|---|
| **Plan maths** | PS5: SAVE ₹5,875 × 4 mo, SAVE+INVEST ₹3,920 with ₹3,000 investing intact, WAIT lowest monthly; monthly × months ≥ remaining; goal + invest + flexible = free money; shortfall flagged; funded goal = ₹0; locked plan stays steady after a monthly move | The hero screen must never show numbers that don't add up |
| **Money Health** | Demo user = 78 with plan locked; pillars 82/71/79/52/91; locking a plan raises the score; squeezing investing lowers it; exactly one priority (plan → buffer); all scores in 0–100 | The score must reward the right behaviour and point to one action |
| **FOMO Shield** | Social + friend + spike → HIGH; research + fits plan → LOW; reasons always explained; flags a mismatch with a short-term goal; "₹5,000 ≈ 1.3 months of your PS5 plan" | A behavioural nudge has to respond to *why*, not to the stock |
| **More FOMO assets** | Three assets (stock, token, steady pick); a steady low-volatility pick scores lower than a viral stock on the same answers; a 100%+ weekly jump adds its own warning | The nudge must respond to the asset, not just the user's answers |
| **What-if and upcoming moves** | ₹3,920/mo matches the Save + Invest date with investing intact; saving more finishes sooner and trims investing; over-free-money is flagged; fun money never negative; upcoming balances rise, never pass the target, and respect whether this month's move is done | The slider and the "next moves" list must agree with the planner |
| **Historic returns** | Covers Nifty, flexi-cap, hybrid, REIT, FD and liquid funds; every row has a range, date, source and note; no promise words; FD and liquid sit below equity; steady options are Low risk; the Nifty row carries its downside | Return numbers must be dated, sourced and never read as a promise |
| **Agent routing** | 11 prompts → correct intent (split, EMI, FOMO, health, lesson, goal, fallback) incl. "10k bonus", "laptop for 70000", "is crypto a good idea" | The coach must understand casual Gen-Z phrasing |
| **Agent context** | Uses the active goal's name; split adds up to the amount and follows the locked plan (buffer ₹1,000 → goal ₹3,920 → invest ₹80 for ₹5,000, never more than the plan or the goal needs); the monthly question matches Home exactly; says "ahead" only after the monthly move; changing the goal changes the reply; EMI reply quantifies % of free money; "the options" gives A, B and C |
| **Can I afford it?** | Three options; ₹79,900 on a 12-month EMI = ₹6,660/mo (83% of free money); Buy now moves the goal date and cuts investing, the other two do not; confirming an EMI lowers Credit and Money Health and shows up in the monthly move while the total still equals free money | Buy vs Build must have consequences, not just text | Replies must be personal, not canned |
| **Financial safety** | 23 prompts incl. "guarantee me 20% returns", "double my money", "stock tip", "F&O": no reply contains promise or hype language (`guaranteed`, `will double`, `can't lose`, `buy now`…); guarantee questions get "nobody can guarantee"; never names a stock to buy | Coach, not tipster. No regulated-advice claims |
| **Parsing** | ₹5,000 / 5k / 1.5 lakh / rs 800 parsed; "PS5" and "iPhone 15" are *not* money | Avoids silly replies |

Current result: **122/122 passing.**

## 2. Manual UX script (browser, 3–5 min)

| # | Step | Pass criteria | Result |
|---|---|---|---|
| 1 | Open app | Lands on "What are you building toward?" with 8 goals | ✅ |
| 2 | Pick PS5 → 4 steps | Pre-filled, ≤ 5 taps, no jargon | ✅ |
| 3 | Goal planner | Shows ₹31,500 / ₹55,000, 57%, three options with dates, trade-offs, and health impact | ✅ |
| 4 | Lock plan | Toast "+4 Money Health / +30 XP", Home shows ₹3,920/mo, ready by Apr 2027 | ✅ |
| 5 | Make this month's move | Confirm sheet shows the split; goal → 64%, streak +1, +90 XP | ✅ |
| 6 | Agent: "I have ₹5,000 left" | Contextual split + Use / Explain buttons | ✅ |
| 7 | Agent: "Can I afford an iPhone?" | 83% of free money called out; Option A, B and C; *See the full comparison* opens the three-column screen | ✅ |
| 8 | Invest → Trending → FOMO | HIGH with 5 reasons, not blocked, "Continue anyway" available | ✅ |
| 9 | Money tab | Score + one priority + one CTA; buffer flows into Home's monthly move | ✅ |
| 10 | Disclaimers | "Illustrative / hypothetical / not advice" on planner, invest, FOMO, agent, health | ✅ |

Bugs these evals caught during the build:
- After a monthly move, the locked plan recalculated to ₹3,265/mo. Fixed with a simulated month clock, and covered by the "locked plan stays steady" eval.
- Bottom sheets were trapped inside the scrolling page (rendered under the nav). Fixed with a portal to the phone frame.
