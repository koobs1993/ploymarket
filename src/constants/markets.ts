import { secondaryMarketSlugs } from "../data/landingContent";

export const WORLD_CUP_EVENT_SLUG = "world-cup-winner";

export const TRADE_EVENT_SLUGS = [
  WORLD_CUP_EVENT_SLUG,
  ...secondaryMarketSlugs,
] as const;
