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
3. **Home**: Money Health, goal progress → *Make this month's move*.
4. **Ask Agent**: "I have ₹5,000 left this month" → *Use this plan* / *Explain why*.
   Try "Should I buy this iPhone on EMI?" → *Show me both options*.
5. **Invest** → 🔥 Trending VoltEdge → **FOMO Check**.
6. **Money** → 79/100 → one priority: *Build ₹5,000 buffer*.

"Restart demo" (Money tab or desktop sidebar) resets everything.

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
