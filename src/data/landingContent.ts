export const TOURNAMENT_START = new Date("2026-06-28T12:00:00-04:00");

export const BRAND_NAME = "GoatFunded";
export const EVENT_NAME = "GoatFunded World Cup";

export const heroStats = [
  { value: "$10K", label: "Cash Prizes" },
  { value: "$1M", label: "In Funding" },
  { value: "Top 50", label: "Winners" },
];

export const featurePills = [
  "$10K cash prizes",
  "$1M in funding",
  "$2,000 virtual capital",
  "Top 50 win",
  "Free entry",
];

export const prizeHeadline = {
  cash: "$10K CASH",
  funding: "$1M FUNDING",
  tagline: "UP FOR GRABS",
};

export const topTenPrizes = [
  { place: "1", cash: "$5,000", fundedAccount: "$100,000" },
  { place: "2", cash: "$1,500", fundedAccount: "$100,000" },
  { place: "3", cash: "$1,000", fundedAccount: "$100,000" },
  { place: "4", cash: "$700", fundedAccount: "$100,000" },
  { place: "5", cash: "$500", fundedAccount: "$100,000" },
  { place: "6", cash: "$400", fundedAccount: "$50,000" },
  { place: "7", cash: "$300", fundedAccount: "$50,000" },
  { place: "8", cash: "$250", fundedAccount: "$50,000" },
  { place: "9", cash: "$200", fundedAccount: "$50,000" },
  { place: "10", cash: "$150", fundedAccount: "$50,000" },
];

export const places11to50Prizes = [
  { places: "11 – 20", prize: "$10,000 account", winners: "10 accounts" },
  { places: "21 – 50", prize: "$5,000 account", winners: "30 accounts" },
];

export const prizeTotals = [
  { label: "Total cash prizes", value: "$10,000" },
  { label: "Total funded accounts", value: "$1,000,000" },
  { label: "Total prize pool", value: "$1,010,000", featured: true },
  { label: "Total winners", value: "50" },
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

export const brandPoints = [
  {
    title: "Fast, Transparent Payouts",
    body: "GoatFunded is built around clear payout rules, simple requirements, and reliable reward processing.",
  },
  {
    title: "$250M+ Paid Out",
    body: "GoatFunded has already paid out more than $250,000,000 to traders worldwide.",
  },
  {
    title: "Trader-First Rules",
    body: "Clear targets, straightforward limits, and a platform experience designed around active traders.",
  },
];

export const faqs = [
  {
    question: "Is the GoatFunded World Cup free to enter?",
    answer:
      "Yes. The tournament is free to enter. Every participant starts with $2,000 in virtual capital and competes on World Cup prediction markets for a chance to win from the $1,010,000 prize pool — $10,000 in cash plus $1,000,000 in funded accounts.",
  },
  {
    question: "What will I be trading?",
    answer:
      "You'll trade prediction markets tied only to World Cup matches. That means match outcomes, event contracts, and World Cup-specific opportunities. No futures markets, no unrelated categories, just World Cup predictions.",
  },
  {
    question: "How do I win prizes?",
    answer:
      "Your leaderboard position is based on total tournament P&L. The higher your P&L, the higher you rank. The top 10 win cash plus funded accounts, places 11–50 win funded accounts, and 50 traders total take home prizes.",
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

export const navLinks = [
  { label: "Markets", href: "#markets" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Prizes", href: "#prizes" },
  { label: "Rules", href: "#rules" },
  { label: "FAQ", href: "#faq" },
];
