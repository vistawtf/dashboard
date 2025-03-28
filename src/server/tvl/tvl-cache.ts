import { closestDay } from '@/server/utils';
import { getAllTVLs } from '@/server/tvl/tvls';
import { DAY, YEAR } from '@/server/time-constants';
import { alignDataPointsTimestamps, combineDataPoints } from '@/components/chart/chart-utils';
import { currentTVLCache, tvlResponseCache, type CachedTVLData } from '@/server/cache';

const CACHE_KEY = 'tvl_data';

export async function getAllTVLsWithCache() {
  const cached = tvlResponseCache.get(CACHE_KEY);
  if (cached) {
    return cached;
  }

  const freshData = await getTvl();
  tvlResponseCache.set(CACHE_KEY, freshData);
  return freshData;
}

async function getTvl(): Promise<CachedTVLData> {
  const tvls = await getAllTVLs();

  for (const [protocol, tvlArray] of Object.entries(tvls)) {
    if (tvlArray.length > 0) {
      const lastTVL = tvlArray[tvlArray.length - 1];
      if (lastTVL) {
        currentTVLCache.set(protocol, lastTVL.usd);
      }
    }
  }

  const chartData = Object.values(tvls).map((tvl) =>
    tvl.map((x) => ({
      timestamp: x.timestamp,
      value: x.usd
    }))
  );

  const alignedData = chartData.map((data) =>
    alignDataPointsTimestamps({
      data,
      stepSize: DAY,
      endTimestamp: closestDay(Date.now()),
      startTimestamp: closestDay(Date.now() - YEAR)
    })
  );

  return {
    tvls,
    chartData,
    combinedTVL: combineDataPoints(alignedData)
  };
}
