import { TableCell, TableRow } from "@/components/ui/table";
import { MONTHS_PER_YEAR } from "@/lib/constants/time";
import type { CurrencyRate } from "@/lib/types/currency-rates";
import { EditableCell } from "./editable-cell";

interface RateRowProps {
  currency: string;
  homeCurrency: string;
  rates: CurrencyRate[];
  onRateChange: (month: number, rate: number) => Promise<void>;
  maxEditableMonth: number;
}

export function RateRow({
  currency,
  homeCurrency,
  rates,
  onRateChange,
  maxEditableMonth,
}: RateRowProps) {
  return (
    <TableRow className="bg-muted/10">
      <TableCell className="font-medium sticky left-0 text-muted-foreground pl-4 text-xs italic border-r bg-background z-10">
        {currency} ➜ {homeCurrency}
      </TableCell>
      {Array.from({ length: MONTHS_PER_YEAR }, (_, i) => i + 1).map((month) => {
        const rate = rates.find((r) => r.month === month)?.rate;
        const isDisabled = month > maxEditableMonth;

        return (
          <TableCell key={month} className="text-right p-0">
            <EditableCell
              value={rate}
              currency={currency}
              onChange={(value) => onRateChange(month, value)}
              isRate
              disabled={isDisabled}
            />
          </TableCell>
        );
      })}
    </TableRow>
  );
}
