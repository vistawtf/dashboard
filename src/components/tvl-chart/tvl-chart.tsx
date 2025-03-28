import { USDToggele } from './usd-toggle';
import { useMemo, useRef, useState } from 'react';
import { Filter, FILTERS } from './filter';
import { TimeChart } from '../chart/time-chart';
import { DAY } from '@/server/time-constants';
import { alignDataPointsTimestamps, combineDataPoints, type DataPoint } from '../chart/chart-utils';
import { closestDay } from '@/server/utils';
import { CopyToClipboard } from '../copy-to-clipboard';
import { LastUpdated } from '../last-update';
import { TVLHeader } from './tvl-header';
import { useETHPrice } from './use-eth-price';

function useCombineDataPoints(
  data: DataPoint[][],
  filter: number,
  defaultValue?: DataPoint[]
): DataPoint[] {
  const cache = useRef<Record<number, DataPoint[]>>(
    defaultValue
      ? {
          [filter]: defaultValue
        }
      : {}
  );

  return useMemo<DataPoint[]>(() => {
    if (cache.current[filter]) {
      return cache.current[filter]!;
    }

    const alignedData = data.map((data) =>
      alignDataPointsTimestamps({
        data,
        stepSize: DAY,
        endTimestamp: closestDay(Date.now()),
        startTimestamp: closestDay(Date.now() - filter)
      })
    );

    cache.current[filter] = combineDataPoints(alignedData);

    return cache.current[filter]!;
  }, [data, filter]);
}

function convertToETH(data: DataPoint[], ethPriceHistory: DataPoint[] | null): DataPoint[] {
  if (!ethPriceHistory || ethPriceHistory.length === 0) return data;

  return data.map((point) => {
    // Find the closest ETH price point
    const closestPricePoint = ethPriceHistory.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - point.timestamp) < Math.abs(prev.timestamp - point.timestamp)
        ? curr
        : prev;
    });

    return {
      timestamp: point.timestamp,
      value: point.value / closestPricePoint.value
    };
  });
}

export function TVLChart({
  title,
  logo,
  description,
  tvls,
  defaultValue
}: {
  defaultValue?: DataPoint[];
  tvls: DataPoint[][];
  title: string;
  logo?: string;
  description: string;
}) {
  const [filter, setFilter] = useState<Filter>('year');
  const [isUSD, setIsUSD] = useState(true);
  const timestamp = getLastTimestamp(tvls);
  const ethPriceHistory = useETHPrice();

  const usdTVL = useCombineDataPoints(tvls, FILTERS[filter].value, defaultValue);
  const TVL = useMemo(() => {
    if (isUSD) return usdTVL;
    return convertToETH(usdTVL, ethPriceHistory);
  }, [usdTVL, ethPriceHistory, isUSD]);

  return (
    <div
      className="relative bg-[#111] p-8 rounded border border-white border-opacity-10"
      id="home-tvl"
    >
      {!isUSD && !ethPriceHistory && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          Loading ETH price history...
        </div>
      )}
      <TVLHeader
        title={title}
        logo={logo}
        description={description}
        changeRange={FILTERS[filter].long}
        isUSD={isUSD}
        data={TVL}
      />
      <div className="mt-4 md:mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <USDToggele isUSD={isUSD} setIsUSD={setIsUSD} />
          <Filter filter={filter} setFilter={setFilter} />
        </div>
        <TimeChart data={TVL} />
        <div className="flex items-center justify-end gap-2">
          <LastUpdated timestamp={timestamp} />
          <CopyToClipboard />
        </div>
      </div>
    </div>
  );
}

/**
 * Get the last timestamp from an array of data points
 * Assumes that each array is sorted by timestamp
 */
function getLastTimestamp(dataPointsArray: DataPoint[][]): number {
  let lastTimestamp = 0;

  for (const dataPoints of dataPointsArray) {
    const value = dataPoints[dataPoints.length - 1];

    if (value && value.timestamp > lastTimestamp) {
      lastTimestamp = value.timestamp;
    }
  }

  return lastTimestamp;
}
