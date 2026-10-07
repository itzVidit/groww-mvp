# 🎮 Groww Dreams

> A product MVP that redesigns **Groww for the Gen-Z investor**. It starts from the thing you *want* (a PS5, a Goa trip, an iPhone), shows exactly what your money needs to do, and protects you from impulse decisions on the way.

<div align="center">

### Why start with a SIP when a 22-year-old is thinking "I want a PS5"?

Groww Dreams reverses the funnel: **Aspiration → Goal → Plan → Money action → Progress → Wealth.** Three pillars carry it, and a rule-based Money Agent is the front door to all of them.

```
✨ Want today. Wealth tomorrow. No jargon in between. ✨
```

**🔗 Live demo: [groww-mvp.vercel.app](https://groww-mvp.vercel.app)** · works on desktop and phone

</div>

---

## 📋 Table of Contents

- [What Problem Does This Solve?](#-what-problem-does-this-solve)
- [Core Concept: Three Pillars](#-core-concept-three-pillars)
- [The Money Agent](#-the-money-agent)
- [XP, Tiers and Streak Rewards](#-xp-tiers-and-streak-rewards)
- [System Architecture](#-system-architecture)
- [Demo Path](#-demo-path-35-minutes)
- [Project Structure](#-project-structure)
- [Setup and Running](#-setup-and-running)
- [Evals](#-evals)
- [Deploy](#-deploy)
- [Integrating with Groww](#-integrating-with-groww)
- [Tech Stack](#-tech-stack)
- [Future Work](#-future-work)

---

## 📌 What Problem Does This Solve?

Investing apps start from the product: SIPs, funds, stocks, CAGR. A first-jobber thinks *"I want a PS5"* and is forced to translate that into jargon before they can act. Most stop there, or buy whatever Instagram says is going up.

The real tension isn't irresponsibility, it is **"I want to enjoy my life today *and* be financially secure tomorrow."** Shopping apps serve the first half with EMIs; investing apps serve the second with dashboards. Nobody connects the two.

Groww Dreams connects them:
- **Wants are legitimate.** The app shows what a goal costs and a path to it, while protecting long-term investing.
- **Trade-offs are visible.** Every choice shows what you gain and what you give up.
- **Protection without paternalism.** Friction appears where impulse decisions happen, then steps aside. Nothing is blocked.

**Who it's for:** Indian first-time investors aged 20–26, such as students, part-timers and first-jobbers, who use EMIs, follow finfluencers and have little patience for financial education.

---

## 🧠 Core Concept: Three Pillars

| # | Pillar | What it does |
|---|--------|--------------|
| 1 | **Dream → Money Autopilot** *(the hero)* | Shows what a goal costs ("2.9 months of your free money") and three plans: **Save**, **Save + Invest** and **Wait longer**. Each shows date, split bar, trade-off and Money Health impact. Lock one and Home shows *where your whole ₹35,000 goes*. Goal money is assumed to earn **0%**, so no plan relies on returns. |
| 2 | **Can I afford it?** | Enter a price and EMI months, then compare **Buy now (EMI)**, **Build first** and **Invest + wait** on monthly cash flow, goal date, buffer and EMI as a share of free money. Choosing the EMI lowers the Credit pillar and shows up in the monthly move. |
| 3 | **FOMO Shield** | Before buying a trending asset, pick an amount and answer *"why are you buying this?"*. You get a FOMO risk with reasons and what the amount costs your goal ("₹5,000 ≈ 1.3 months of your PS5 plan"). Pausing earns XP. |

**Money Health** is the scoreboard: five habits, **one** priority, **one** action.

Also in the app:
- **What if I save…** slider on the planner, with a "How we calculated this" panel.
- **Autopilot + Next moves:** switch it on, tap *Skip to next month (demo)* and the move runs by itself.
- **Past returns, side by side:** Nifty 50, flexi-cap, hybrid, REITs, FDs and liquid funds on one scale, each with risk and a dated source.
- **Installable and offline:** manifest, icons and a service worker, plus focus traps in sheets, 44px touch targets and AA-contrast text.

---

## 🤖 The Money Agent

The agent answers in plain language using the **same numbers** as the rest of the app.

| You say | It does |
|---------|---------|
| "I have ₹5,000 left this month" | Splits it by your locked plan: buffer first, then goal, then investing |
| "Can I afford an iPhone?" | Opens pillar 2 with the three options |
| "Everyone's buying VoltEdge. Should I?" | Opens the FOMO Shield |
| "What are nifty returns?" | Shows dated historic returns side by side |

**It is rule-based by design**, so every reply can be evaluated. It shows what each reply was based on ("Based on: your PS5 plan · free money ₹8,000 …"), never picks stocks and never promises returns.

---

## 🏆 XP, Tiers and Streak Rewards

Gamification rewards **behaviour, not trading volume**. XP comes from saving, investing monthly, finishing a 45-second Money Minute and pausing on impulse buys. Perks lower the cost of investing instead of pushing you to trade more.

| Tier | XP | Perks |
|------|----|-------|
| 🌱 Seed | 0 | Money Minute lessons, Can I afford it? checks |
| 🪙 Saver | 200 | Monthly report card, 1 streak freeze a month |
| 🧱 Builder | 500 | ₹0 brokerage on 5 orders a month, 2 freezes |
| 📈 Investor | 1000 | ₹0 brokerage on 15 orders a month, priority support |
| 👑 Legend | 2000 | ₹0 brokerage on all delivery orders, early access |

| Streak | Reward |
|--------|--------|
| 7 | 🧊 Streak freeze |
| 14 | 🏷️ ₹0 brokerage on 3 orders |
| 30 | 🎟️ ₹100 gift voucher |
| 60 | 🏷️ ₹0 brokerage on 10 orders |
| 100 | 💸 ₹250 SIP bonus |

Tap the tier chip in the top bar to open the rewards sheet. Rewards are concept values for the demo. Definitions live in `src/lib/rewards.ts`.

---

## 🏗️ System Architecture

No backend. All logic is **pure functions** in `src/lib`, so every product decision can be tested without a UI. State is one Context + `useReducer` store, persisted to `localStorage`.

```
                 ┌──────────────────────────────────────┐
                 │   Onboarding → demo user + goal      │
                 └───────────────────┬──────────────────┘
                                     │
                         ┌───────────▼───────────┐
                         │   Store (useReducer)  │  XP · streak · goals · claimed rewards
                         └───────────┬───────────┘
                                     │
     ┌──────────────┬────────────────┼────────────────┬──────────────┐
┌────▼─────┐  ┌─────▼─────┐   ┌──────▼──────┐   ┌──────▼─────┐  ┌─────▼─────┐
│ plan.ts  │  │ afford.ts │   │   fomo.ts   │   │ health.ts  │  │ rewards.ts│
│ 3 plans  │  │ Buy/Build │   │ risk + goal │   │ 5 pillars  │  │ tiers and │
│ monthly  │  │ /Invest   │   │ impact      │   │ 1 priority │  │ streaks   │
└────┬─────┘  └─────┬─────┘   └──────┬──────┘   └──────┬─────┘  └─────┬─────┘
     └──────────────┴────────┬───────┴─────────────────┴──────────────┘
                             │
                    ┌────────▼────────┐
                    │    agent.ts     │  rule-based intent routing + guardrails
                    └────────┬────────┘
                             │
       Home · Goals · GoalPlanner · Invest · Money · Agent   (phone UI + desktop UI)
```

**Layout:** `?type=mobile` gives the phone-first UI, `?type=windows` gives the desktop UI with a top nav. With no param it picks automatically by screen width.

---

## 🎬 Demo Path (3–5 minutes)

1. Pick 🎮 **PS5**, then tap through 4 short questions (pre-filled with Vidit's data).
2. **Dream → Money:** compare SAVE / SAVE + INVEST / WAIT LONGER and lock a plan.
3. **Home:** *Where your ₹35,000 goes*, then *Make this month's move*.
4. **Ask Agent:** "I have ₹5,000 left this month" → a split that follows your locked plan.
5. **Can I afford it?** Ask "Can I afford an iPhone?" → *See the full comparison*.
6. **Invest** → 🔥 Trending VoltEdge → **FOMO Shield** → pick an amount → HIGH → *Sleep on it*.
7. **Money** → score moved → one priority: *Build ₹5,000 buffer*.
8. Tap the **tier chip** in the top bar → tiers, perks and streak rewards to claim.

*Restart demo* (Money tab or the desktop Demo guide) resets everything.

---

## 📁 Project Structure

```
src/
  data/        demo user, goal templates, investment categories, lessons, returns
  lib/         pure logic: plan, afford, fomo, health, agent, rewards, format, layout
  state/       one Context + useReducer store, persisted to localStorage
  components/  Layout (shell, nav), ui (Button, Sheet, ProgressBar…), cards, RewardsBar
  pages/       Onboarding, Home, Goals, GoalPlanner (hero), Invest, Money, Agent
evals/run.ts   automated evals over lib/
docs/          write-up, prompts, evals, integration guide
public/        manifest, icons, service worker
```

---

## 🚀 Setup and Running

```bash
npm install
npm run dev       # http://localhost:5173
npm run evals     # 122 logic evals
npm run build     # static site in dist/
```

Change the demo user in `src/data/demo.ts` (`DEMO_USER`, `DEMO_GOAL`). Every screen derives from it.

---

## ✅ Evals

`npm run evals` runs **122 checks** over the pure logic: plan maths, Money Health, FOMO Shield, the Can I afford it? options, agent routing and context, and financial safety (23 prompts such as "guarantee me 20% returns" must never get promise or hype language back).

Full table and the manual UX script: [docs/EVALS.md](docs/EVALS.md). Prompts: [docs/PROMPTS.md](docs/PROMPTS.md).

---

## 🌐 Deploy

`dist/` is a plain static site with hash routing, so no rewrite rules are needed.

- **Vercel:** `npx vercel --prod` (framework: Vite, output: `dist`)
- **Netlify:** `npx netlify deploy --prod --dir dist`
- Or drag `dist/` onto app.netlify.com/drop

---

## 🔌 Integrating with Groww

Mount `<DreamsApp host={...} />` inside an existing app. See [docs/INTEGRATION.md](docs/INTEGRATION.md).

---

## 🛠️ Tech Stack

| Layer | Choice |
|-------|--------|
| UI | React 18, TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 |
| Routing | React Router (hash) |
| State | Context + `useReducer`, `localStorage` |
| Hosting | Vercel |

---

## 🔭 Future Work

- Account Aggregator data, so free money is **measured**, not self-reported.
- Route goal money to a liquid fund and long-term money to an index SIP in one flow.
- Swap in an LLM (the GR-1 path) with the same guardrails, using the evals as its regression suite.
- Real brokerage perks wired to Groww's order flow.
- Measure plan lock rate, month-2 retention, FOMO pause rate and buffer adoption.

Full product write-up: [docs/WRITEUP.md](docs/WRITEUP.md)

---

*Concept only. Not affiliated with or endorsed by Groww. Not investment advice. All data is mock.*
