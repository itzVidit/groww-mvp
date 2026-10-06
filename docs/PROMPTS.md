# Prompts used

Built with Claude Code (Claude Opus 5.5) in three prompts.

## 1. Product brief → plan

A long brief setting the role (PM, UX designer and senior full-stack engineer for a one-day case study) and the rules:

- **Thesis:** "Groww that helps Gen Z turn what they want today into wealth for tomorrow", not "Groww with a Gen-Z skin".
- **Priorities:** product thinking > financial complexity; UX > backend; polish > feature count; one coherent experience.
- **North-star questions** every feature must answer (What do I want? Can I afford it? How do I reach it? What do I do today? Is this FOMO? Am I getting healthier?).
- **Hero:** Dream → Money (PS5: ₹55,000, ₹31,500 saved, 4 months → SAVE / SAVE + INVEST / WAIT LONGER).
- **Six screens:** Onboarding, Home, Goals, Money Agent (mocked coach), FOMO Shield, Can I afford it?, Financial Health; plus lightweight Invest and Money Minute.
- **Gamify progress, never trading.** Financial-safety language rules. An explicit "do not build" list.
- **Default user:** Vidit, 22, ₹35k income.
- **First task:** output architecture, screen map, journey, components, data model, state, build order, day plan and non-goals, then wait.

## 2. Constraint

> "make it in react and no backend at all"

## 3. Go

> "go"

## Decisions made while building (not in the brief)

- **Fixed inconsistent demo numbers.** ₹28k savings vs ₹31.5k goal progress became separate general savings and goal money. Free money is set to ₹8,000/mo so the three plans show real trade-offs.
- **Goal money earns 0% in all plan maths**, so returns are never projected.
- **Money Health weights** were chosen so the brief's 82/71/79/52/91 pillars give 78. Locking a plan visibly raises the score.
- **FOMO Shield asks the user *why* they're buying** instead of scoring the stock. That keeps it honest about being a behavioural nudge.
- **The agent is rule-based** with intent matching over live state. It's deterministic, so it can be evaluated (see EVALS.md).
