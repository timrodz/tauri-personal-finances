import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TOTAL_COLUMNS } from "@/lib/constants/balance-sheets";
import { MONTHS } from "@/lib/constants/time";
import { Account } from "@/lib/types/accounts";
import { Entry } from "@/lib/types/balance-sheets";
import { useMemo } from "react";
import { AccountSection } from "./account-section";

type AccountGridProps = {
  accounts: Account[];
  entries: Entry[];
  onEntryChange: (
    accountId: string,
    month: number,
    amount: number,
  ) => Promise<void>;
};
export function AccountsGrid({
  accounts,
  entries,
  onEntryChange,
}: AccountGridProps) {
  const { assets, liabilities } = useMemo(() => {
    const activeAccounts = accounts.filter((a) => !a.isArchived);
    const assetsList = activeAccounts.filter((a) => a.accountType === "Asset");
    const liabilitiesList = activeAccounts.filter(
      (a) => a.accountType === "Liability",
    );

    return {
      assets: assetsList,
      liabilities: liabilitiesList,
    };
  }, [accounts]);

  return (
    <Card className="p-0 overflow-auto">
      <Table className="min-w-300">
        <TableHeader>
          <TableRow>
            <TableHead className="w-50 sticky left-0 z-10 bg-background border-r">
              Account
            </TableHead>
            <TableHead className="w-25 text-center">Currency</TableHead>
            {MONTHS.map((month) => (
              <TableHead key={month} className="text-right min-w-25">
                {month}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-muted/50 font-semibold hover:bg-muted/50">
            <TableCell
              colSpan={TOTAL_COLUMNS}
              className="sticky left-0 bg-muted/50 border-r"
            >
              ASSETS
            </TableCell>
          </TableRow>
          <AccountSection
            accounts={assets}
            entries={entries}
            onEntryChange={onEntryChange}
          />
          {assets.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={TOTAL_COLUMNS}
                className="text-center text-muted-foreground py-4"
              >
                No asset accounts found.
              </TableCell>
            </TableRow>
          )}

          <TableRow className="bg-muted/50 font-semibold hover:bg-muted/50">
            <TableCell
              colSpan={TOTAL_COLUMNS}
              className="sticky left-0 bg-muted/50 border-r"
            >
              LIABILITIES
            </TableCell>
          </TableRow>
          <AccountSection
            accounts={liabilities}
            entries={entries}
            onEntryChange={onEntryChange}
          />
          {liabilities.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={TOTAL_COLUMNS}
                className="text-center text-muted-foreground py-4"
              >
                No liability accounts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
