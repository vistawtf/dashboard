import { useState } from 'react';
import { formatter } from '@/components/utils/format';
import { ArrowChange } from './arrow-change';
import { useETHPrice } from './tvl-chart/use-eth-price';
import { useMemo } from 'react';

const currencyFormatter = new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' });
const ethFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function ProjectRanking({
  projects,
  isUSD = true
}: {
  projects: {
    label: string;
    values: { usd: number }[];
  }[];
  isUSD?: boolean;
}) {
  const ethPrice = useETHPrice();

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aValue = a.values[a.values.length - 1];
      const bValue = b.values[b.values.length - 1];

      if (aValue === undefined || bValue === undefined) {
        return 0;
      }

      return bValue.usd - aValue.usd;
    });
  }, [projects]);

  return (
    <table className="w-full overflow-hidden">
      <thead className="bg-[#242424] font-mono text-[#949494] border-b border-white border-opacity-10">
        <tr>
          <th className="p-4 text-sm font-medium text-left border-r border-white border-opacity-10">
            PROJECT
          </th>
          <th className="p-4 text-sm font-medium text-right border-r border-white border-opacity-10">
            7D CHANGE
          </th>
          <th className="p-4 text-sm font-medium text-right border-r border-white border-opacity-10">
            TVL ({isUSD ? 'USD' : 'ETH'})
          </th>
        </tr>
      </thead>
      <tbody className="bg-[#191919]">
        {sortedProjects.map((project) => (
          <ProjectRankingRow
            key={project.label}
            label={project.label}
            values={project.values}
            isUSD={isUSD}
            ethPrice={ethPrice}
          />
        ))}
      </tbody>
    </table>
  );
}

function percentChange(a: number, b: number): number {
  return (100 * (a - b)) / b;
}

function ProjectRankingRow({
  label,
  values,
  isUSD,
  ethPrice
}: {
  label: string;
  values: { usd: number }[];
  isUSD: boolean;
  ethPrice: number | null;
}) {
  const TVL = useMemo(() => {
    const lastValue = values[values.length - 1];
    if (!lastValue) return 0;
    if (isUSD) return lastValue.usd;
    if (!ethPrice) return 0;
    return lastValue.usd / ethPrice;
  }, [values, isUSD, ethPrice]);

  const weekChange = useMemo(() => {
    const lastValue = values[values.length - 1];
    const weekValue = values[values.length - 8];
    if (!lastValue || !weekValue) return 0;
    if (isUSD) return percentChange(lastValue.usd, weekValue.usd);
    if (!ethPrice) return 0;
    return percentChange(lastValue.usd / ethPrice, weekValue.usd / ethPrice);
  }, [values, isUSD, ethPrice]);

  return (
    <tr className="border-t border-white border-opacity-10">
      <td className="p-4 border-r border-white border-opacity-10">{label}</td>
      <td className="relative p-4 font-light text-right border-r border-white border-opacity-10">
        <ArrowChange change={weekChange}>
          <span>
            {Intl.NumberFormat('en-US', {
              maximumFractionDigits: 2
            }).format(weekChange)}
            %
          </span>
        </ArrowChange>
      </td>
      <Cell value={TVL} isUSD={isUSD} />
    </tr>
  );
}

function Cell({ value, isUSD }: { value: number; isUSD: boolean }) {
  const [hover, setHover] = useState(false);
  const formattedValue = isUSD
    ? currencyFormatter.format(value)
    : `Ξ ${ethFormatter.format(value)}`;
  const shortValue = isUSD ? formatter.format(value) : `Ξ ${formatter.format(value)}`;

  return (
    <td className="p-4 font-light text-right">
      <div className="relative inline-block">
        <span className="invisible">{formattedValue}</span>
        <span
          className="absolute inset-0 cursor-default"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {hover ? formattedValue : shortValue}
        </span>
      </div>
    </td>
  );
}
