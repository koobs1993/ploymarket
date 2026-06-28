import firstPlaceIcon from "../img/1st-place.png";
import getFundedIcon from "../img/get-funded-icon.png";
import joinFreeIcon from "../img/join-free-icon.png";
import predictWinIcon from "../img/predict-win-icon.png";

export const TOURNAMENT_START = new Date("2026-06-28T12:00:00-04:00");

export const BRAND_NAME = "GoatFunded";
export const EVENT_NAME = "GoatFunded World Cup";
export const SIGNUP_URL = "#join";

export const heroBenefits = ["No risk", "No payment"];

export const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Prizes", href: "#prizes" },
  { label: "Events", href: "#markets" },
] as const;

export const predictionsSection = {
  eyebrow: "Live markets",
  title: "Trade These World Cup Predictions",
  subtitle:
    "Real-time odds. Pick your events & compete on the leaderboard. Trade on every game, every outcome, goal scorers and more!",
};

export const prizeHeadline = {
  cash: "$10K CASH",
  funding: "$1M FUNDING",
  tagline: "UP FOR GRABS",
};

export const podiumPrizes = [
  {
    place: "2",
    rank: "2nd Place",
    cash: "$1,500",
    account: "$100,000 account",
    tone: "silver" as const,
  },
  {
    place: "1",
    rank: "1st Place",
    cash: "$5,000",
    account: "$100,000 account",
    tone: "gold" as const,
    featured: true,
    placeImage: firstPlaceIcon,
  },
  {
    place: "3",
    rank: "3rd Place",
    cash: "$1,000",
    account: "$100,000 account",
    tone: "bronze" as const,
  },
];

export const leaderboardPrizes = [
  { rank: "4th", cash: "$700", account: "$100,000 account" },
  { rank: "5th", cash: "$500", account: "$100,000 account" },
  { rank: "6th – 10th", cash: "$150 – $400", account: "$50,000 account" },
  { rank: "11th – 20th", cash: "—", account: "$10,000 account" },
  { rank: "21st – 50th", cash: "—", account: "$5,000 account" },
];

export const prizeTotals = [
  { label: "Total cash", value: "$10,000" },
  { label: "Total funding", value: "$1,000,000" },
  { label: "Total pool", value: "$1,010,000", featured: true },
  { label: "Winners", value: "50" },
];

export const howItWorks = [
  {
    name: "Join FREE",
    description: "Create your free account — no payment required",
    illustration: joinFreeIcon,
    illustrationAlt: "Gold gift box with a free price tag.",
    showArrow: true,
  },
  {
    name: "Get Funded",
    description: "Get $100,000 in simulated capital",
    illustration: getFundedIcon,
    illustrationAlt: "Stacks of gold banknotes labeled $100,000.",
    showArrow: true,
  },
  {
    name: "Predict & Win",
    description: "Win cash and funded accounts",
    illustration: predictWinIcon,
    illustrationAlt: "Gold trophy with coins, cash, and an upward arrow.",
    showArrow: false,
  },
] as const;

export const howItWorksArrow =
  "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/692fa452ca73ac3398155143_arrow-right.webp";

export const secondaryMarketSlugs = [
  "world-cup-golden-glove-winner-20260603195306910",
  "world-cup-nation-to-reach-final",
] as const;

export const mediaLogos = [
  {
    name: "Benzinga",
    src: "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/692ed6079186810825794947_Brand%20Logo%20Benzinga.svg",
  },
  {
    name: "Yahoo",
    src: "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/692ed607848b4e056f0413aa_Brand%20Logo%20Yahoo.svg",
  },
  {
    name: "Nasdaq",
    src: "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/692ed6075eb327586d0279c7_Brand%20Logo%20Nasdaq.svg",
  },
  {
    name: "MarketWatch",
    src: "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/692ed607044de3f0b708561f_Brand%20Logo%20Market.svg",
  },
];

export const brandStats = [
  {
    title: "$20 MILLION",
    desc: "Paid in rewards",
    featured: true,
    image:
      "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/692fb68556f4c57cd11f7838_Brand%20Illustration%20Stats%201.webp",
  },
  {
    title: "$2,180",
    desc: "Average Reward",
    image:
      "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/692fb684e7b22e8ba06c538f_Brand%20Illustration%20Stats%202.webp",
  },
  {
    title: "250,000+",
    desc: "Traders using GFT Worldwide",
    image:
      "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/692fb6857543d624ec45f782_Brand%20Illustration%20Stats%203.webp",
  },
];

export const faqs = [
  {
    question: "Is the GoatFunded World Cup free to enter?",
    answer:
      "Yes. Entry is completely free. You trade with $100,000 in simulated capital and compete for $10,000 in cash plus $1,000,000 in funded accounts.",
  },
  {
    question: "What can I predict?",
    answer:
      "World Cup winner, Golden Glove, nations reaching the final, and more. The tournament covers a wide range of World Cup prediction markets.",
  },
  {
    question: "How do I win prizes?",
    answer:
      "Rankings are based on tournament P&L. Top 10 win cash plus funded accounts. Places 11–50 win funded accounts. Fifty traders total take home prizes.",
  },
  {
    question: "When does the tournament start?",
    answer: "Registration is open now. Full tournament trading begins 28 June.",
  },
  {
    question: "Do I need to pay anything?",
    answer: "No. There is no entry fee and no payment required to participate.",
  },
  {
    question: "What makes this different from regular betting?",
    answer:
      "This is a free prediction trading tournament on simulated capital. You're competing on a leaderboard for cash and funded accounts — not placing real-money bets.",
  },
];

export const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/goatfundedtrader_gft?igsh=eDlyODkwdG0zZ2dq",
    icon: "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/6937cebdf77f9ec38b137b03_Instagram%20Icon.webp",
  },
  {
    name: "Discord",
    href: "https://discord.gg/ZRNesgBrtv",
    icon: "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/6937cebd31230c2958e27f08_Discord%20Icon.webp",
  },
  {
    name: "X",
    href: "https://x.com/GoatFunded",
    icon: "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/6937cebde2c0aead6e64b309_X%20Icon.webp",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@goatfundedtrader",
    icon: "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/6937cebd979eba55bb6031e0_Youtube%20Icon.webp",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/goat-funded-trader?trk=public_post_feed-actor-image",
    icon: "https://cdn.prod.website-files.com/692d3a3e37a293dd19f3b43e/6937cebd643ba66e13e7d085_LinkedIn%20Icon.webp",
  },
] as const;
