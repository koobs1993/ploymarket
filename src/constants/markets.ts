import { secondaryMarketSlugs } from "../data/landingContent";

export const WORLD_CUP_EVENT_SLUG = "world-cup-winner";

export const FIFA_WC_SERIES_ID = "11433";

export const TRADE_EVENT_SLUGS = [
  WORLD_CUP_EVENT_SLUG,
  ...secondaryMarketSlugs,
] as const;

export const WORLD_CUP_MATCH_SLUG_PATTERN =
  /^fifwc-[a-z0-9]{2,4}-[a-z0-9]{2,4}-\d{4}-\d{2}-\d{2}$/;
