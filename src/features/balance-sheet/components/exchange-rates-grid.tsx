import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MONTHS } from "@/lib/constants/time";
import type { CurrencyRate } from "@/lib/types/currency-rates";
import { cn } from "@/lib/utils";
import { RateRow } from "./rate-row";

interface ExchangeRatesGridProps {
  currencies: string[];
  homeCurrency: string;
  rates: CurrencyRate[];
  onRateChange: (
    fromCurrency: string,
    month: number,
    rate: number,
  ) => Promise<void>;
  maxEditableMonth: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function ExchangeRatesGrid({
  currencies,
  homeCurrency,
  rates,
  onRateChange,
  maxEditableMonth,
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
      <Table className="min-w-300">
        <TableHeader>
          <TableRow>
            <TableHead className="w-75 sticky left-0 z-10 bg-background border-r font-bold">
              Exchange Rates
            </TableHead>
            {MONTHS.map((month, index) => (
              <TableHead
                key={month}
                className={cn(
                  "text-right min-w-25",
                  index + 1 > maxEditableMonth && "text-muted-foreground/60",
                )}
              >
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
                  r.fromCurrency === currency && r.toCurrency === homeCurrency,
              )}
              onRateChange={(month, rate) =>
                onRateChange(currency, month, rate)
              }
              maxEditableMonth={maxEditableMonth}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
