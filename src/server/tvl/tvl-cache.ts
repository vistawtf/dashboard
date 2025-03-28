import { closestDay } from '@/server/utils';
import { getAllTVLs, type TVLResponse } from '@/server/tvl/tvls';
import { DAY, YEAR } from '@/server/time-constants';
import {
  alignDataPointsTimestamps,
  combineDataPoints,
  type DataPoint
} from '@/components/chart/chart-utils';

const REFRESH_PERIOD = 60 * 1000; // 1 minute

let refreshInterval: number | undefined;
let lastTvlValue: {
  tvls: TVLResponse;
  chartData: DataPoint[][];
  combinedTVL: DataPoint[];
} | null = null;

export async function getAllTVLsWithCache() {
  if (refreshInterval === undefined) {
    refreshInterval = setInterval(async () => {
      lastTvlValue = await getTvl();
    }, REFRESH_PERIOD);
  }

  if (lastTvlValue) {
    return lastTvlValue;
  }

  lastTvlValue = await getTvl();
  return lastTvlValue;
}

async function getTvl() {
  const tvls = await getAllTVLs();

  // Convert TVLData to DataPoint format
  const chartData = Object.values(tvls).map((tvl) =>
    tvl.map((x) => ({
      timestamp: x.timestamp,
      value: x.usd
    }))
  );

  // Align data points to daily intervals for the last year
  const alignedData = chartData.map((data) =>
    alignDataPointsTimestamps({
      data,
      stepSize: DAY,
      endTimestamp: closestDay(Date.now()),
      startTimestamp: closestDay(Date.now() - YEAR)
    })
  );

  // Combine all protocols' TVL
  const combinedTVL = combineDataPoints(alignedData);

  return {
    tvls,
    chartData,
    combinedTVL
  };
}
