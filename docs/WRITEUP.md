# Groww Dreams: product write-up

## The problem

Investing apps start from the product: SIPs, funds, stocks, CAGR. A 22-year-old on their first salary thinks *"I want a PS5," "I want to go to Goa."* Every app makes them translate a want into jargon first. Most stop there, or buy whatever Instagram says is going up.

The real tension isn't irresponsibility: **"I want to enjoy my life today *and* be financially secure tomorrow."** Shopping apps serve the first half with EMIs; investing apps serve the second with dashboards. Nobody connects them.

## Who it's for

Indian first-time investors aged 20–26: students, part-timers, first-jobbers. They see finfluencers, use EMIs, and have little patience for financial education.

## The solution

Groww Dreams reverses the funnel: **Aspiration → Goal → Plan → Money action → Progress → Wealth.** Three pillars carry it, and the agent is the front door to all of them.

1. **Dream → Money Autopilot (the hero).** The app shows what a goal costs ("2.9 months of your free money") and three plans: **Save** (fastest, trims investing), **Save + Invest** (a little later, investing intact), **Wait longer** (lowest monthly). Each shows date, split bar, trade-off and Money Health impact. Lock one and Home shows **where your whole ₹35,000 goes**: essentials, goal, investing, flexible spending. Goal money is assumed to earn nothing, so no plan relies on returns.
2. **Can I afford it?** Price, EMI months, and three columns: **Buy now (EMI)**, **Build first**, **Invest + wait**. Each shows monthly cash flow, goal date, investing, emergency buffer and EMI as a share of free money. Choosing the EMI lowers the Credit pillar and appears in the monthly move, so the choice has visible consequences.
3. **FOMO Shield.** Before buying a trending stock, the user picks an amount and answers "why are you buying this?". They get a FOMO Risk with reasons and what the amount costs their goal ("₹5,000 ≈ 1.3 months of your PS5 plan"). Nothing is blocked, and pausing earns XP.

**Money Health** is the scoreboard: five habits, **one** priority, **one** action. **Money Agent** answers in plain language using the same numbers: "I have ₹5,000 left" splits by your locked plan (buffer, then goal, then investing), and "Can I afford an iPhone?" opens pillar two. It never picks stocks or promises returns.

Gamification rewards behaviour, not trading: streaks, XP for saving, investing monthly, finishing a 45-second Money Minute and pausing on impulse buys.

## Why this is more than "Groww with a Gen-Z skin"

- **Wants are legitimate.** It shows the cost and a path, and protects long-term investing meanwhile.
- **Trade-offs are visible.** Every choice shows what you gain and give up.
- **Protection without paternalism.** FOMO Shield and Can I afford it? add friction where impulse decisions happen, then step aside.
- **Complementary to Groww's AI.** GR-1 does portfolio and research. This is cash-flow and goal coaching: what to do with this month's money.

## Honest about the crowd

"Every rupee has a job" is YNAB's idea, and goal-based investing, round-ups and AI assistants all exist in India. The edge is the combination at the moment of decision, especially pre-trade friction, which we found no major app shipping (absence of evidence, not proof).

## What we deliberately didn't build

Real trading, KYC, bank or credit integrations, an LLM backend, social features. The agent is **rule-based by design**, so every reply can be evaluated. Credit is a labelled sample profile, except for EMIs the user confirms.

## Next, if this were real

- Account Aggregator data, so free money is measured, not self-reported.
- Route goal money to a liquid fund and long-term money to an index SIP in one flow.
- Swap in an LLM (the GR-1 path) with the same guardrails, using the evals as its regression suite.
- Measure plan lock rate, month-2 retention, FOMO pause rate and buffer adoption.
