export const TOURNAMENT_START = new Date("2026-06-28T12:00:00-04:00");

export const heroStats = [
  { value: "$250,000", label: "Guaranteed" },
  { value: "$100,000", label: "To the Champion" },
  { value: "Top 500", label: "Earn Rewards" },
];

export const featurePills = [
  "$250K guaranteed",
  "$2,000 virtual capital",
  "Top 500 win",
  "Country leaderboards",
  "Free entry",
];

export const howItWorks = [
  {
    step: "1",
    title: "Join the tournament (it's free)",
    body: "Once you're in, you'll be ready to compete when World Cup Knockouts open.",
    note: "The tournament runs from 28 June - 19 July.",
  },
  {
    step: "2",
    title: "Get $2,000 simulated funding",
    body: "Every trader begins with the same $2,000 virtual balance, so the leaderboard comes down to your predictions, timing, and risk management.",
  },
  {
    step: "3",
    title: "Predict the World Cup",
    body: "Place trades on World Cup match outcomes and event contracts. Choose the markets where you think the odds are wrong and make your move.",
  },
];

export const podiumPrizes = [
  { place: "2", rank: "2nd Place", amount: "$40,000", bonus: "+ Select 150k account" },
  { place: "1", rank: "1st Place", amount: "$100,000", bonus: "+ Select 150k account", featured: true },
  { place: "3", rank: "3rd Place", amount: "$20,000", bonus: "+ Select 150k account" },
];

export const rewardTiers = [
  { rank: "4th", reward: "$12,000", bonus: "+ Select 150k account" },
  { rank: "5th", reward: "$9,500", bonus: "+ Select 150k account" },
  { rank: "6th - 10th", reward: "$3,000", bonus: "+ Select 150k account" },
  { rank: "11th - 25th", reward: "$1,200", bonus: "+ Select 100k account" },
  { rank: "26th - 50th", reward: "$600", bonus: "+ Select 100k account" },
  { rank: "51st - 100th", reward: "$250", bonus: "+ Select 50k account" },
  { rank: "101st - 200th", reward: "$80", bonus: "+ Select 50k account" },
  { rank: "201st - 500th", reward: "", bonus: "+ Select 25k account" },
  { rank: "All entrants", reward: "50% off coupon", bonus: "(one-time use)" },
];

export const phases = [
  {
    label: "Phase 1",
    dates: "28 June - 3 July",
    title: "Round of 32",
    description:
      "Start with $2,000. Every account can be reset one time for free during this phase. No drawdown rules. Hit zero and you are knocked out. Late entry stays open through this round.",
    stats: [
      { label: "Starting Balance", value: "$2,000" },
      { label: "Resets", value: "1 (free)" },
      { label: "Power Plays", value: "5 total" },
      { label: "Multipliers", value: "None" },
    ],
  },
  {
    label: "Phase 2",
    dates: "4 - 8 July",
    title: "Round of 16",
    description: "Resets close.",
    stats: [
      { label: "Resets", value: "None" },
      { label: "Power Plays", value: "5" },
      { label: "Multipliers", value: "None" },
    ],
  },
  {
    label: "Phase 3",
    dates: "8 - 19 July",
    title: "Quarterfinals to Final",
    description:
      "New entries close. The stakes climb with round multipliers all the way to the final on July 19.",
    stats: [
      { label: "Resets", value: "None" },
      { label: "Power Plays", value: "5" },
      { label: "Multipliers", value: "Quarterfinals: 1.25x P&L\nSemifinals: 1.5x P&L\nFinal: 2x Power Mode" },
    ],
  },
];

export const tradeifyPoints = [
  {
    title: "Fast, Transparent Payouts",
    body: "Tradeify is built around clear payout rules, simple requirements, and reliable reward processing.",
  },
  {
    title: "$250M+ Paid Out",
    body: "Tradeify has already paid out more than $200,000,000 to traders.",
  },
  {
    title: "Trader-First Rules",
    body: "Clear targets, straightforward limits, and a platform experience designed around active futures traders.",
  },
];

export const faqs = [
  {
    question: "Is the Tradeify Prediction World Cup free to enter?",
    answer:
      "Yes. The tournament is free to enter. Every participant starts with $2,000 in virtual capital and competes on World Cup prediction markets for a chance to win from the $250,000 guaranteed prize pool.",
  },
  {
    question: "What will I be trading?",
    answer:
      "You'll trade prediction markets tied only to World Cup matches. That means match outcomes, event contracts, and World Cup-specific opportunities. No futures markets, no unrelated categories, just World Cup predictions.",
  },
  {
    question: "How do I win prizes?",
    answer:
      "Your leaderboard position is based on total tournament P&L. The higher your P&L, the higher you rank. The top 500 traders win cash prizes or Select eval accounts, and every participant receives a one-time 50% coupon regardless of rank.",
  },
  {
    question: "What are Power Plays?",
    answer:
      "Power Plays are limited boosters of up to 2x for your highest-conviction trades. Every trader gets 5 for the entire tournament. Before placing a trade, you can activate a Power Play to boost that trade's P&L impact. The multiplier increases at each stage – 1.25x at the Quarterfinals, 1.5x at the Semifinals, and 2x at the Final. Use them carefully, because once they're gone, they're gone.",
  },
  {
    question: "When does the tournament start?",
    answer:
      "Registration opens June 18. Full tournament trading begins June 28 when Round of 32.",
  },
  {
    question: "Can I enter after the tournament starts?",
    answer:
      "Yes, late entry is allowed during the Round of 32. You can join until the Quarterfinals begin. After that, no new entries are accepted.",
  },
  {
    question: "What happens if my balance hits zero?",
    answer:
      "You have one free reset available, which you can use during the Round of 32 only. Once the Round of 32 ends, no further resets are available.",
  },
  {
    question: "What makes this different from regular betting?",
    answer:
      "This is a leaderboard-based prediction trading tournament. You're not just placing one-off bets. You're managing virtual capital, trading World Cup markets, using Power Plays, climbing the leaderboard, and competing against other traders and countries for prizes.",
  },
];
