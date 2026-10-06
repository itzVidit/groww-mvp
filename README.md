# Groww Dreams

**Groww that helps Gen Z turn what they want today into wealth for tomorrow.**

A one-day product MVP for the "Design Groww for the Gen-Z investor" case study.
React, TypeScript, Vite and Tailwind. No backend: all data is mocked and kept in `localStorage`.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run evals     # 76 logic evals (plan maths, health, FOMO, agent, safety)
npm run build     # static site in dist/
```

## Deploy (public URL)

`dist/` is a plain static site and uses hash routing, so no rewrite rules are needed.

- **Vercel:** `npx vercel --prod` (framework: Vite, output: `dist`)
- **Netlify:** `npx netlify deploy --prod --dir dist`
- Or drag `dist/` onto app.netlify.com/drop

## Demo path (3–5 min)

1. Pick 🎮 PS5 → tap through 4 short questions (pre-filled with Vidit's data).
2. **Dream → Money**: compare SAVE / SAVE + INVEST / WAIT LONGER → lock a plan.
3. **Home**: *Where your ₹35,000 goes* (essentials + the monthly move) → *Make this month's move*.
4. **Ask Agent**: "I have ₹5,000 left this month" → a split that follows your locked plan → *Use this plan*.
5. **Can I afford it?** Ask "Can I afford an iPhone?" → *Show me the options* → *See the full comparison*: Buy now (EMI) vs Build first vs Invest + wait.
6. **Invest** → 🔥 Trending VoltEdge → **FOMO Shield** → pick an amount → HIGH → goal impact → *Sleep on it*.
7. **Money** → score moved → one priority: *Build ₹5,000 buffer*.

"Restart demo" (Money tab or desktop sidebar) resets everything.

## Also in the app

- **What if I save…** slider on the planner, plus a "How we calculated this" panel (0% returns, no hidden maths).
- **Autopilot + Next moves:** switch it on, then *Skip to next month (demo)* and the move runs by itself. A celebration shows the bar fill after each move.
- **FOMO Shield** works on three hypothetical assets (viral stock, meme token, steady gold ETF).
- **Past returns, side by side** on Invest (and via the agent: "what are nifty returns?"): Nifty 50, flexi-cap, aggressive hybrid, REITs, FDs and liquid funds on one scale, with risk and a dated source. Data lives in `src/data/returns.ts`; refresh it before you present.
- **Agent** shows what each reply was based on ("Based on: your PS5 plan · free money ₹8,000 · …").
- **Installable / offline:** manifest, icons and a service worker (production build). Focus traps in sheets, 44px touch targets, AA-contrast text, and an error screen with a one-tap reset.

## Integrating with Groww

See [docs/INTEGRATION.md](docs/INTEGRATION.md): mount `<DreamsApp host={...} />`; layout via `?type=windows` or `?type=mobile`.

## Change the demo user

Edit `src/data/demo.ts` (`DEMO_USER`, `DEMO_GOAL`). Every screen derives from it.

## Structure

```
src/
  data/       demo user, goal templates, investment categories, lessons
  lib/        pure logic: plan.ts, health.ts, fomo.ts, agent.ts, format.ts
  state/      one Context + useReducer store, persisted to localStorage
  components/ Layout (shell, nav, agent button), ui (Button, Sheet, ProgressBar…), cards
  pages/      Onboarding, Home, Goals, GoalPlanner (hero), Invest, Money, Agent
evals/run.ts  automated evals over lib/
docs/         write-up, prompts, evals
```

Concept only. Not affiliated with Groww. Not investment advice.
