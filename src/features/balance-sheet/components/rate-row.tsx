import { TableCell, TableRow } from "@/components/ui/table";
import { CurrencyRate } from "@/lib/types";
import { EditableCell } from "./editable-cell";

interface RateRowProps {
  currency: string;
  homeCurrency: string;
  rates: CurrencyRate[];
  onRateChange: (month: number, rate: number) => Promise<void>;
}

export function RateRow({
  currency,
  homeCurrency,
  rates,
  onRateChange,
}: RateRowProps) {
  return (
    <TableRow className="bg-muted/10">
      <TableCell className="font-medium sticky left-0 text-muted-foreground pl-4 text-xs italic border-r bg-background">
        {currency} ➜ {homeCurrency}
      </TableCell>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const rate = rates.find((r) => r.month === month)?.rate;

        return (
          <TableCell key={month} className="text-right p-0">
            <EditableCell
              value={rate}
              onChange={(value) => onRateChange(month, value)}
              isRate
            />
          </TableCell>
        );
      })}
    </TableRow>
  );
}
