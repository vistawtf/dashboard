import { dataFormater } from '@/format';
import { useEffect, useState, type ReactNode } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const DAY = 1000 * 60 * 60 * 24;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 12 * MONTH;

const valueToLabel: Record<
  number,
  {
    long: string;
    short: string;
  }
> = {
  [DAY]: {
    long: '1 day',
    short: '24H'
  },
  [WEEK]: {
    long: '7 days',
    short: '7D'
  },
  [MONTH]: {
    long: '1 month',
    short: '1M'
  },
  [3 * MONTH]: {
    long: '3 months',
    short: '3M'
  },
  [YEAR]: {
    long: '1 year',
    short: '1Y'
  },
  [Infinity]: {
    long: 'All time',
    short: 'MAX'
  }
};

function FilterOption({
  filter,
  setFilter,
  value
}: {
  filter: number;
  setFilter: (value: number) => void;
  value: number;
}) {
  return (
    <div
      className={
        filter === value
          ? 'bg-[#2E46C8] rounded border border-white border-opacity-10 px-3 py-1 select-none cursor-pointer'
          : 'bg-[#242424] rounded border border-white border-opacity-10 px-3 py-1 select-none cursor-pointer'
      }
      onClick={() => setFilter(value)}
    >
      {valueToLabel[value].short}
    </div>
  );
}

type Token = 'ethereum' | 'rocket-pool';

async function getTokenPrice(token: Token): Promise<number> {
  const request = await fetch('/api/token-price', {
    method: 'post',
    body: JSON.stringify({ token })
  });

  const response = await request.json();
  return response.price;
}

export function Change({ positive, children }: { positive: boolean; children: ReactNode }) {
  const color = positive ? '#22c55e' : '#ef4444';

  return (
    <div className="flex items-center justify-end gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="12"
        viewBox="0 0 14 12"
        style={{
          fill: color,
          transform: positive ? 'rotate(0deg)' : 'rotate(180deg)'
        }}
      >
        <path d="M7 0L13.9282 12H0.0717969L7 0Z"></path>
      </svg>
      <div className="font-mono" style={{ color }}>
        {children}
      </div>
    </div>
  );
}

export function Chart({
  data
}: {
  data: {
    date: String;
    ETH: number;
    timestamp: number;
  }[];
}) {
  const [filter, setFilter] = useState(Infinity);
  const [onMobile, setOnMobile] = useState(false);
  const [ETHPrice, setETHPrice] = useState(1);
  const [isUSD, setIsUSD] = useState(false);
  const [filteredData, setFilteredData] = useState(data);
  const [rangeChange, setRangeChange] = useState(0);

  useEffect(() => {
    getTokenPrice('ethereum').then((price) => setETHPrice(price));
  }, []);

  useEffect(() => {
    const now = Date.now();
    let filteredData = data.filter((x) => now - x.timestamp < filter);

    if (isUSD) {
      filteredData = filteredData.map((x) => ({ ...x }));

      for (const value of filteredData) {
        value.ETH *= ETHPrice;
      }
    }

    setFilteredData(filteredData);
    setRangeChange(
      (100 * (filteredData[filteredData.length - 1].ETH - filteredData[0].ETH)) /
        filteredData[0].ETH
    );
  }, [filter, isUSD]);

  const handleResize = () => {
    setOnMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="mt-16 md:mt-24 mb-16">
      <div className="flex items-center justify-between gap-4 md:gap-8 flex-wrap">
        <div>
          <h2 className="text-2xl md:text-3xl font-medium mb-2">Liquid Staking</h2>
          <div className="text-lg md:text-xl opacity-70 max-w-[600px] font-light">
            Total ETH value of all liquid staking protocol assets.
          </div>
        </div>
        <div className="min-w-[120px] text-right w-full lg:w-auto">
          <div className="text-[40px] md:leading-[50px] font-medium">
            {isUSD ? '$' : ''}
            {dataFormater(Number(data[data.length - 1].ETH * (isUSD ? ETHPrice : 1)))}{' '}
            {isUSD ? '' : 'ETH'}
          </div>
          <Change positive={rangeChange >= 0}>
            <span>
              {Intl.NumberFormat('en-US', {
                maximumFractionDigits: 2
              }).format(rangeChange)}
              %
            </span>
            <span className="text-white">
              <span className="opacity-60"> /</span> {valueToLabel[filter].long}
            </span>
          </Change>
        </div>
      </div>
      <div className="mt-4 md:mt-8 rounded">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center justify-center font-mono text-xs md:text-sm gap-2 lg:gap-3 font-bold">
            <div
              className="rounded border border-white border-opacity-10 px-3 py-1 select-none cursor-pointer"
              style={{
                backgroundColor: isUSD ? '#2E46C8' : '#242424'
              }}
              onClick={() => setIsUSD(true)}
            >
              USD
            </div>
            <div
              className="rounded border border-white border-opacity-10 px-3 py-1 select-none cursor-pointer"
              style={{
                backgroundColor: !isUSD ? '#2E46C8' : '#242424'
              }}
              onClick={() => setIsUSD(false)}
            >
              ETH
            </div>
          </div>
          <div className="flex items-center justify-end font-mono font-bold text-xs md:text-sm gap-2 lg:gap-3 flex-wrap">
            <FilterOption setFilter={setFilter} filter={filter} value={DAY} />
            <FilterOption setFilter={setFilter} filter={filter} value={WEEK} />
            <FilterOption setFilter={setFilter} filter={filter} value={MONTH} />
            <FilterOption setFilter={setFilter} filter={filter} value={3 * MONTH} />
            <FilterOption setFilter={setFilter} filter={filter} value={YEAR} />
            <FilterOption setFilter={setFilter} filter={filter} value={Infinity} />
          </div>
        </div>
        <div className="w-full h-full">
          <ResponsiveContainer width={'100%'} height={330} style={{ padding: 4 }}>
            <AreaChart data={filteredData}>
              <CartesianGrid vertical={false} horizontal={true} stroke="#ffffff11" />
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                tickLine={false}
                axisLine={false}
                className="font-mono text-xs"
                dataKey="date"
                stroke={'#6b7280'}
                minTickGap={100}
              />
              <YAxis
                tickLine={false}
                className="font-mono text-xs"
                axisLine={false}
                stroke={'#6b7280'}
                domain={['dataMin', 'dataMax']}
                tickFormatter={dataFormater}
              />
              <Tooltip
                content={(data) => (
                  <div className="bg-[#191919] border border-white border-opacity-10 rounded p-4 text-xs font-mono">
                    <p className="mb-2">
                      {data.payload && data.payload.length ? data.payload[0].payload.date : ''}
                    </p>
                    <span className="opacity-50 mr-6">{isUSD ? 'USD: ' : 'ETH: '}</span>
                    {data.payload && data.payload.length
                      ? Intl.NumberFormat('us')
                          .format(Math.round(Number(data.payload[0].value)))
                          .toString()
                      : ''}
                  </div>
                )}
              ></Tooltip>
              <Area
                type="monotone"
                dataKey="ETH"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUv)"
                activeDot={{
                  fill: '#3b82f6',
                  stroke: '#FFFFFF88',
                  strokeWidth: 1
                }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div />
      </div>
    </div>
  );
}
