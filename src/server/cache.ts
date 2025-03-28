import TTLCache from '@isaacs/ttlcache';
import { type DataPoint } from '@/components/chart/chart-utils';
import { type TVLResponse } from '@/server/tvl/tvls';

const HISTORICAL_CACHE_DURATION = 12 * 60 * 60 * 1000;
const CURRENT_TVL_REFRESH = 5 * 60 * 1000;
const ETH_PRICE_REFRESH = 60 * 60 * 1000;

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
  max: 100
});
