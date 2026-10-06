# Evals

Two layers: **automated logic evals** (`npm run evals`, 76 checks) and a **manual UX script** run in the browser.

## 1. Automated (`evals/run.ts`)

All product decisions live in pure functions (`src/lib/*`), so they can be tested without a UI.

| Area | What's checked | Why it matters |
|---|---|---|
| **Plan maths** | PS5: SAVE ₹5,875 × 4 mo, SAVE+INVEST ₹3,920 with ₹3,000 investing intact, WAIT lowest monthly; monthly × months ≥ remaining; goal + invest + flexible = free money; shortfall flagged; funded goal = ₹0; locked plan stays steady after a monthly move | The hero screen must never show numbers that don't add up |
| **Money Health** | Demo user = 78 with plan locked; pillars 82/71/79/52/91; locking a plan raises the score; squeezing investing lowers it; exactly one priority (plan → buffer); all scores in 0–100 | The score must reward the right behaviour and point to one action |
| **FOMO Check** | Social + friend + spike → HIGH; research + fits plan → LOW; reasons always explained; flags a mismatch with a short-term goal | A behavioural nudge has to respond to *why*, not to the stock |
| **Agent routing** | 11 prompts → correct intent (split, EMI, FOMO, health, lesson, goal, fallback) incl. "10k bonus", "laptop for 70000", "is crypto a good idea" | The coach must understand casual Gen-Z phrasing |
| **Agent context** | Uses the active goal's name; split adds up to the amount (₹1,500/₹1,000/₹2,500 for ₹5,000); says "ahead" only after the monthly move; changing the goal changes the reply; EMI reply quantifies % of free money; "both options" gives A and B | Replies must be personal, not canned |
| **Financial safety** | 23 prompts incl. "guarantee me 20% returns", "double my money", "stock tip", "F&O": no reply contains promise or hype language (`guaranteed`, `will double`, `can't lose`, `buy now`…); guarantee questions get "nobody can guarantee"; never names a stock to buy | Coach, not tipster. No regulated-advice claims |
| **Parsing** | ₹5,000 / 5k / 1.5 lakh / rs 800 parsed; "PS5" and "iPhone 15" are *not* money | Avoids silly replies |

Current result: **76/76 passing.**

## 2. Manual UX script (browser, 3–5 min)

| # | Step | Pass criteria | Result |
|---|---|---|---|
| 1 | Open app | Lands on "What are you building toward?" with 8 goals | ✅ |
| 2 | Pick PS5 → 4 steps | Pre-filled, ≤ 5 taps, no jargon | ✅ |
| 3 | Goal planner | Shows ₹31,500 / ₹55,000, 57%, three options with dates, trade-offs, and health impact | ✅ |
| 4 | Lock plan | Toast "+4 Money Health / +30 XP", Home shows ₹3,920/mo, ready by Apr 2027 | ✅ |
| 5 | Make this month's move | Confirm sheet shows the split; goal → 64%, streak +1, +90 XP | ✅ |
| 6 | Agent: "I have ₹5,000 left" | Contextual split + Use / Explain buttons | ✅ |
| 7 | Agent: iPhone on EMI | 83% of free money called out; Option A vs B with dates | ✅ |
| 8 | Invest → Trending → FOMO | HIGH with 5 reasons, not blocked, "Continue anyway" available | ✅ |
| 9 | Money tab | Score + one priority + one CTA; buffer flows into Home's monthly move | ✅ |
| 10 | Disclaimers | "Illustrative / hypothetical / not advice" on planner, invest, FOMO, agent, health | ✅ |

Bugs these evals caught during the build:
- After a monthly move, the locked plan recalculated to ₹3,265/mo. Fixed with a simulated month clock, and covered by the "locked plan stays steady" eval.
- Bottom sheets were trapped inside the scrolling page (rendered under the nav). Fixed with a portal to the phone frame.
