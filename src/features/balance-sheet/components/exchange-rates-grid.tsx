import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RateRow } from "./rate-row";
import { MONTHS } from "@/constants/months";
import { CurrencyRate } from "@/lib/types";

interface ExchangeRatesGridProps {
  currencies: string[];
  homeCurrency: string;
  rates: CurrencyRate[];
  onRateChange: (
    fromCurrency: string,
    month: number,
    rate: number
  ) => Promise<void>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function ExchangeRatesGrid({
  currencies,
  homeCurrency,
  rates,
  onRateChange,
  containerRef,
  onScroll,
}: ExchangeRatesGridProps) {
  if (currencies.length === 0) return null;

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="border rounded-md overflow-x-auto mt-8"
    >
      <Table className="min-w-[1200px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px] sticky left-0 z-10 bg-background border-r font-bold">
              Exchange Rates
            </TableHead>
            {MONTHS.map((month) => (
              <TableHead key={month} className="text-right min-w-[100px]">
                {month}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currencies.map((currency) => (
            <RateRow
              key={currency}
              currency={currency}
              homeCurrency={homeCurrency}
              rates={rates.filter(
                (r) =>
                  r.fromCurrency === currency && r.toCurrency === homeCurrency
              )}
              onRateChange={(month, rate) =>
                onRateChange(currency, month, rate)
              }
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
