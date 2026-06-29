export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  icon: string;
  image: string;
  outcomePrices: string;
  clobTokenIds?: string;
  oneDayPriceChange: number | null;
  volume?: number | string;
  groupItemTitle?: string;
  events?: Array<{ slug: string }>;
}

export interface PolymarketEvent {
  slug?: string;
  title: string;
  endDate: string;
  icon: string;
  image: string;
  volume: number | string;
  closed?: boolean;
  description?: string;
  eventMetadata?: {
    context_description?: string;
  };
  markets?: PolymarketMarket[];
}

export interface TradeEventSummary {
  slug: string;
  title: string;
  endDate: string;
  icon: string;
  volume: number;
  description: string;
  outcomes: WorldCupOutcome[];
}

export interface WorldCupOutcome {
  id: string;
  title: string;
  icon: string;
  price: number;
  odds: number;
  change: number;
  volume: number;
  clobTokenId: string;
}

export interface WorldCupData {
  title: string;
  endDate: string;
  icon: string;
  volume: number;
  description: string;
  outcomes: WorldCupOutcome[];
}

export interface TickerItem {
  id: string;
  title: string;
  icon: string;
  odds: number;
  change: number;
}

export interface BetResult {
  stake: number;
  price: number;
  shares: number;
  totalReturn: number;
  profit: number;
}

export interface PriceHistoryPoint {
  t: number;
  p: number;
}

export interface TrendSeries {
  id: string;
  title: string;
  color: string;
  clobTokenId: string;
  history: PriceHistoryPoint[];
}

export interface TrendChartPoint {
  ts: number;
  label: string;
  [teamKey: string]: number | string;
}
