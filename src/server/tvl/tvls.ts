import type { DataPoint } from '@/components/chart/chart-utils';
import { YEAR } from '@/server/time-constants';

const PROTOCOLS = {
  ETHERFI: 'ether.fi',
  ROCKETPOOL: 'rocket-pool',
  LIDO: 'lido',
  STADER: 'stader',
  SWELL: 'swell'
} as const;

type ProtocolResponse = {
  tvl: Array<{
    date: number;
    totalLiquidityUSD: number;
  }>;
};

async function fetchProtocolTVL(protocol: string): Promise<DataPoint[]> {
  try {
    const response = await fetch(`https://api.llama.fi/protocol/${protocol}`);
    if (!response.ok) {
      console.error(`Failed to fetch TVL for ${protocol}:`, response.statusText);
      return [];
    }
    const data: ProtocolResponse = await response.json();

    const oneYearAgo = Date.now() - YEAR;
    return data.tvl
      .map((point) => ({
        timestamp: point.date * 1000,
        value: point.totalLiquidityUSD
      }))
      .filter((point) => point.timestamp >= oneYearAgo)
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error(`Error fetching TVL for ${protocol}:`, error);
    return [];
  }
}

export type TVLData = {
  timestamp: number;
  usd: number;
};

export type TVLResponse = {
  etherFiTVL: TVLData[];
  rocketPoolTVL: TVLData[];
  lidoTVL: TVLData[];
  staderTVL: TVLData[];
  swellTVL: TVLData[];
};

export async function getAllTVLs(): Promise<TVLResponse> {
  const [etherFiTVL, rocketPoolTVL, lidoTVL, staderTVL, swellTVL] = await Promise.all([
    fetchProtocolTVL(PROTOCOLS.ETHERFI),
    fetchProtocolTVL(PROTOCOLS.ROCKETPOOL),
    fetchProtocolTVL(PROTOCOLS.LIDO),
    fetchProtocolTVL(PROTOCOLS.STADER),
    fetchProtocolTVL(PROTOCOLS.SWELL)
  ]);

  const convertToTVLData = (data: DataPoint[]): TVLData[] =>
    data.map((point) => ({
      timestamp: point.timestamp,
      usd: point.value
    }));

  return {
    etherFiTVL: convertToTVLData(etherFiTVL),
    rocketPoolTVL: convertToTVLData(rocketPoolTVL),
    lidoTVL: convertToTVLData(lidoTVL),
    staderTVL: convertToTVLData(staderTVL),
    swellTVL: convertToTVLData(swellTVL)
  };
}
