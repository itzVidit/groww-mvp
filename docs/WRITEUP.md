# Groww Dreams: product write-up

## The problem

Investing apps start from the product: SIPs, mutual funds, stocks, CAGR, risk profiles. A 22-year-old on their first salary doesn't think in those terms. They think *"I want a PS5," "I want to go to Goa," "I want to stop worrying about money."* Every investing app makes them translate a want into finance jargon before anything useful happens. Most stop there, or skip planning entirely and buy whatever Instagram says is going up.

The real tension isn't irresponsibility. It's this: **"I want to enjoy my life today *and* be financially secure tomorrow."** Today's apps make that feel like a choice. Shopping apps serve the first half with EMIs; investing apps serve the second with dashboards. Nobody connects them.

## Who it's for

Indian first-time investors aged 20–26: students, part-timers and first-jobbers. They're exposed to finfluencers, have some FOMO, use EMIs, and have little patience for financial education. They still want long-term independence.

## The solution

Groww Dreams reverses the funnel:

> **Aspiration → Goal → Plan → Money action → Progress → Wealth**

1. **Start with the want.** Onboarding opens with *"What are you building toward?"*: iPhone, PS5, Travel, Bike, First ₹1 Lakh, Financial Freedom. Then five conversational questions, with no risk questionnaire.
2. **Dream → Money (the hero).** The app shows what the goal really costs ("2.9 months of your free money") and three ways to reach it. **Save** is fastest but trims investing. **Save + Invest** is a bit later and keeps investing intact. **Wait longer** has the lowest monthly amount. Each option shows the date, the monthly amount, a split bar of where the money goes, the trade-off in plain words, and how it changes Money Health. Goal money is assumed to earn nothing, so we never rely on returns to make a plan work.
3. **This month's move.** Home turns the plan into one action: ₹3,920 → PS5, ₹3,000 → long-term investing, ₹1,080 → flexible spending. One tap, and progress updates.
4. **Money Agent.** A coach that knows your numbers. "I have ₹5,000 left" gets a balanced split with one-tap apply. "iPhone on EMI?" gets an honest comparison: the EMI eats 83% of your free money, while saving after the PS5 lands it by a specific month with no interest. It never picks stocks or promises returns.
5. **FOMO Check.** Before buying a trending stock, the user answers a 20-second "why are you buying this?" and gets a FOMO Risk with reasons. *"This doesn't mean you shouldn't invest. It means you should understand why."* Nothing is ever blocked, and pausing earns XP.
6. **Money Health.** One score built from five habits (saving, investing, credit, emergency buffer, goals) and **one** priority with **one** action ("Build ₹5,000 buffer"), which flows straight back into the monthly move.

Gamification rewards behaviour, not trading: a money streak, plus XP for saving, investing monthly, finishing a 45-second Money Minute, staying on plan, and pausing on impulse buys. There is never XP for trades or risk-taking.

## Why this is more than "Groww with a Gen-Z skin"

- **Wants are legitimate.** The app never shames a PS5. It shows the cost and a path, and protects long-term investing while you get there.
- **The trade-offs are visible.** Every choice shows what you gain and what you give up.
- **Protection without paternalism.** FOMO Check and the EMI comparison add friction where impulse decisions happen, then step aside.
- **Every screen ends in an action**, not a chart.

## What we deliberately didn't build

Real trading, KYC, bank or credit integrations, an LLM backend, a screener, social features or leaderboards. All of it can be mocked convincingly, and none of it makes the core loop (want → plan → action → progress) stronger for a first version.

## Next, if this were real

- Connect Account Aggregator data so "free money" is measured, not self-reported.
- Route goal money to a liquid fund or FD and long-term money to an index-fund SIP in one flow.
- Swap the rule-based agent for an LLM with the same guardrails, and use the existing evals as its regression suite.
- Measure: plan lock rate, month-2 move retention, FOMO-check pause rate, and buffer adoption.
