import { useEffect, useState } from 'react';
import type { DataPoint } from '@/components/chart/chart-utils';

const REFRESH_INTERVAL = 60 * 1000; // 1 minute
const ONE_YEAR_IN_DAYS = 365;

export function useETHPrice() {
  const [priceHistory, setPriceHistory] = useState<DataPoint[] | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=${ONE_YEAR_IN_DAYS}&interval=daily`
        );

        if (!response.ok) {
          console.error('Failed to fetch ETH price history:', response.statusText);
          return;
        }

        const data = await response.json();

        // Convert price data to our DataPoint format
        // CoinGecko returns prices as [timestamp, price] pairs
        const prices: DataPoint[] = data.prices.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          value: price
        }));

        setPriceHistory(prices);
      } catch (error) {
        console.error('Error fetching ETH price history:', error);
      }
    };

    // Initial fetch
    fetchPrices();

    // Set up periodic refresh
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return priceHistory;
}
