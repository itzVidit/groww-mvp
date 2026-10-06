# Plugging Groww Dreams into the Groww app

Groww Dreams is built as a self-contained module. It follows Groww's navigation and visual language (slim top bar, `Ctrl+K` search, green primary, `#5367FF` accent) so it reads as a native vertical, but the idea, screens and copy are original.

## Mount it

```tsx
import { DreamsApp } from './App'

<DreamsApp host={{ trackEvent, openProduct, startSip }} />
```

- Routing is hash-based (`#/home`, `#/goals/:id`), so it never collides with the host's routes.
- Layout follows `?type=windows` (web) or `?type=mobile` (app WebView / phone). The host should pass `?type=mobile` inside the app and `?type=windows` on groww.in.

## The host adapter (`src/integration/host.tsx`)

| Method | Fired when | Standalone behaviour | In Groww |
|---|---|---|---|
| `trackEvent(name, props)` | plan locked, monthly move confirmed | `console.debug` | forward to Groww analytics |
| `openProduct({id, category, name})` | "Explore on Groww" on an Invest card | `console.debug` | deep-link to the fund / ETF / stock page |
| `startSip({goalId, goalName, monthlyAmount, investAmount})` | monthly move confirmed with an investing slice | `console.debug` | open the real SIP / mandate flow |

Events: `dreams_plan_locked`, `dreams_monthly_move_confirmed`, `dreams_agent_split_applied`, `dreams_afford_add_goal`, `dreams_afford_keep_plan`, `dreams_afford_emi_confirmed`.

## What stays mock until wired

- `src/data/demo.ts`: user profile and goals. Replace with the logged-in user's profile and goal store.
- `src/data/investments.ts`: hypothetical categories. Map each `id` (`index`, `hybrid`, `gold`, `stock`) to a real Groww product list.
- `src/lib/fomo.ts` `TRENDING`: replace with a real trending feed.
- `src/state/store.tsx`: persistence is `localStorage`. Swap for the host's API; the reducer actions are the write surface.

## Design tokens

Colours live in `tailwind.config.js` (`mint` = Groww green, `violet` = Groww blue, `ink`/`paper` neutrals). Re-point them at Groww's tokens and every screen follows.

## Compliance

All copy is labelled hypothetical / not investment advice. Any real product hand-off must go through Groww's standard risk disclosures and KYC gating via `openProduct` / `startSip`.
