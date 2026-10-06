export type LessonVisual = 'sip' | 'fall' | 'diversify' | 'compound' | 'fd'

export interface Lesson {
  id: string
  emoji: string
  title: string
  seconds: number
  hook: string
  explain: string
  visual: LessonVisual
  visualCaption: string
  takeaway: string
}

export const LESSONS: Lesson[] = [
  {
    id: 'sip',
    emoji: '🔁',
    title: 'What is an SIP?',
    seconds: 40,
    hook: 'You already have subscriptions for music and shows. What if one paid you back?',
    explain:
      'An SIP (Systematic Investment Plan) auto-invests a fixed amount every month. When prices are low you get more units, when high you get fewer, so you never have to guess the "right time".',
    visual: 'sip',
    visualCaption: 'Same ₹1,000 every month. Units bought change with price.',
    takeaway: 'Consistency beats timing.',
  },
  {
    id: 'fall',
    emoji: '📉',
    title: 'Why can investments fall?',
    seconds: 45,
    hook: 'Your investment dropped 8% this week. Did you lose money?',
    explain:
      "Prices move with what people expect about the future, and expectations change daily. A drop is only a real loss if you sell. Long-term charts are full of dips. They're normal, not a sign you did something wrong.",
    visual: 'fall',
    visualCaption: 'Illustrative path: dips along the way, upward over years. Not guaranteed.',
    takeaway: "Only invest money you won't need during a dip.",
  },
  {
    id: 'diversify',
    emoji: '🧺',
    title: 'What is diversification?',
    seconds: 35,
    hook: "Would you put your entire salary on one friend's startup?",
    explain:
      "Diversification means spreading money across many companies or asset types. If one has a bad year, the others cushion it. Index funds do this for you automatically.",
    visual: 'diversify',
    visualCaption: 'One basket vs. many. A single bad apple hurts less.',
    takeaway: "Don't bet everything on one thing.",
  },
  {
    id: 'compound',
    emoji: '❄️',
    title: 'Why does compounding matter?',
    seconds: 50,
    hook: 'Starting at 22 vs. 30 can matter more than how much you invest.',
    explain:
      "Compounding is growth on growth. In early years it looks boring. Later, the growth can outpace what you put in. Time is the ingredient you can't buy back.",
    visual: 'compound',
    visualCaption: 'Illustrative only: ₹1,000/month at an assumed steady 10% a year. Real returns vary and can be negative.',
    takeaway: 'Start early, even small.',
  },
  {
    id: 'fd',
    emoji: '🔒',
    title: 'What is an FD?',
    seconds: 30,
    hook: 'Need your money in 6 months? The stock market is the wrong place.',
    explain:
      'A Fixed Deposit locks money with a bank for a set time at a set interest rate. Low risk and predictable, so it\'s great for short-term goals like a PS5 fund. Breaking it early usually costs a small penalty.',
    visual: 'fd',
    visualCaption: 'Predictable, steady growth. Rates vary by bank and tenure.',
    takeaway: 'Short-term goals deserve safe places.',
  },
]
