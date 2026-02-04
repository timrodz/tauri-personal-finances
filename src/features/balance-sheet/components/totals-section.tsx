import { PrivateValue } from "@/components/ui/private-value";
import { TableCell, TableRow } from "@/components/ui/table";
import { getGrowth } from "@/lib/balance-sheets";
import { formatDecimal2Digits } from "@/lib/currency-formatting";
import type { MonthlyTotal } from "@/lib/types/balance-sheets";

interface TotalsSectionProps {
  monthlyTotals: MonthlyTotal[];
  homeCurrency: string;
  maxVisibleMonth: number;
}

export function TotalsSection({
  monthlyTotals,
  homeCurrency,
  maxVisibleMonth,
}: TotalsSectionProps) {
  const Warning = () => (
    <span
      className="ml-1 cursor-help select-none"
      title="Missing exchange rates for one or more accounts"
    >
      ⚠️
    </span>
  );

  return (
    <>
      <TableRow className="font-bold bg-muted/20">
        <TableCell className="sticky left-0 bg-background border-r">
          TOTAL ASSETS ({homeCurrency})
        </TableCell>
        {monthlyTotals.map((t) => (
          <TableCell key={t.month} className="text-right px-4 text-sm">
            {t.month > maxVisibleMonth ? (
              <span className="text-muted-foreground/70">—</span>
            ) : (
              <>
                <PrivateValue value={formatDecimal2Digits(t.totalAssets)} />
                {t.hasMissingRates && <Warning />}
              </>
            )}
          </TableCell>
        ))}
      </TableRow>

      <TableRow className="font-bold bg-muted/20">
        <TableCell className="sticky left-0 bg-background border-r">
          TOTAL LIABILITIES ({homeCurrency})
        </TableCell>
        {monthlyTotals.map((t) => (
          <TableCell key={t.month} className="text-right px-4 text-sm">
            {t.month > maxVisibleMonth ? (
              <span className="text-muted-foreground/70">—</span>
            ) : (
              <>
                <PrivateValue
                  value={formatDecimal2Digits(t.totalLiabilities)}
                />
                {t.hasMissingRates && <Warning />}
              </>
            )}
          </TableCell>
        ))}
      </TableRow>

      <TableRow className="font-bold border-t-2 border-black/10 dark:border-white/10 text-base">
        <TableCell className="sticky left-0 bg-background border-r">
          NET WORTH ({homeCurrency})
        </TableCell>
        {monthlyTotals.map((t) => (
          <TableCell key={t.month} className="text-right px-4">
            {t.month > maxVisibleMonth ? (
              <span className="text-muted-foreground/70">—</span>
            ) : (
              <>
                <PrivateValue value={formatDecimal2Digits(t.netWorth)} />
                {t.hasMissingRates && <Warning />}
              </>
            )}
          </TableCell>
        ))}
      </TableRow>

      <TableRow className="text-muted-foreground italic text-xs">
        <TableCell className="sticky left-0 bg-background border-r">
          Growth ({homeCurrency})
        </TableCell>
        {monthlyTotals.map((t, i) => (
          <TableCell key={t.month} className="text-right px-4">
            {t.month > maxVisibleMonth ? (
              <span className="text-muted-foreground/70">—</span>
            ) : (
              <PrivateValue value={getGrowth(i, monthlyTotals)} />
            )}
          </TableCell>
        ))}
      </TableRow>
    </>
  );
}
