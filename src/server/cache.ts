import TTLCache from '@isaacs/ttlcache';
import { type DataPoint } from '@/components/chart/chart-utils';
import { type TVLResponse } from '@/server/tvl/tvls';

// Cache durations
const HISTORICAL_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours for historical data
const CURRENT_TVL_REFRESH = 5 * 60 * 1000; // 5 minutes for current TVL
const ETH_PRICE_REFRESH = 60 * 60 * 1000; // 1 hour for ETH price

export type CachedTVLData = {
  tvls: TVLResponse;
  chartData: DataPoint[][];
  combinedTVL: DataPoint[];
};

export const ethPriceCache = new TTLCache<string, DataPoint[]>({
  ttl: ETH_PRICE_REFRESH,
  max: 1
});

export const tvlResponseCache = new TTLCache<string, CachedTVLData>({
  ttl: HISTORICAL_CACHE_DURATION,
  max: 1
});

export const currentTVLCache = new TTLCache<string, number>({
  ttl: CURRENT_TVL_REFRESH,
  max: 100 // Maximum number of protocols we expect to track
});
