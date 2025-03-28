import { useEffect, useState } from 'react';
import { type DataPoint } from '@/components/chart/chart-utils';
import { ethPriceCache } from '@/server/cache';

const CACHE_KEY = 'eth_price_history';

export function useETHPrice() {
  const [priceHistory, setPriceHistory] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const cached = ethPriceCache.get(CACHE_KEY);
        if (cached) {
          setPriceHistory(cached);
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=365&interval=daily'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch ETH price history');
        }

        const data = await response.json();
        const prices: DataPoint[] = data.prices.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          value: price
        }));

        ethPriceCache.set(CACHE_KEY, prices);
        setPriceHistory(prices);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch ETH price'));
        setIsLoading(false);
      }
    };

    void fetchPrices();
  }, []);

  return { priceHistory, isLoading, error };
}
