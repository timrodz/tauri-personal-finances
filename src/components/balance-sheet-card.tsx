import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BalanceSheet } from "@/lib/types/balance-sheets";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowRightIcon, CalendarIcon } from "lucide-react";

interface BalanceSheetCardProps {
  balanceSheet: BalanceSheet;
  onClick: () => void;
  badgeText?: string;
  badgeLevel?: "info" | "warning" | "error";
}

export function BalanceSheetCard({
  balanceSheet,
  onClick,
  badgeText,
  badgeLevel = "warning",
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
        <div className="flex items-center gap-2">
          {badgeText && (
            <StatusBadge level={badgeLevel} text={badgeText} />
          )}
          <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Click to view details
        </div>
      </CardContent>
    </Card>
  );
}
