import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BalanceSheet } from "@/lib/types";
import { ArrowRightIcon, CalendarIcon } from "lucide-react";

interface BalanceSheetCardProps {
  balanceSheet: BalanceSheet;
  onClick: () => void;
}

export function BalanceSheetCard({
  balanceSheet,
  onClick,
}: BalanceSheetCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors group"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          {balanceSheet.year}
        </CardTitle>
        <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Click to view details
        </div>
      </CardContent>
    </Card>
  );
}
