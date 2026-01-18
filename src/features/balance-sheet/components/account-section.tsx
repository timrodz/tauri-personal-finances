import { TableCell, TableRow } from "@/components/ui/table";
import { MONTHS } from "@/constants/months";
import { Account, Entry } from "@/lib/types";
import { memo, useCallback, useMemo } from "react";
import { EditableCell } from "./editable-cell";

interface AccountSectionProps {
  accounts: Account[];
  entries: Entry[];
  onEntryChange: (
    accountId: string,
    month: number,
    amount: number
  ) => Promise<void>;
}

interface AccountCellProps {
  accountId: string;
  month: number;
  amount: number | undefined;
  onEntryChange: (
    accountId: string,
    month: number,
    amount: number
  ) => Promise<void>;
}

export function AccountSection({
  accounts,
  entries,
  onEntryChange,
}: AccountSectionProps) {
  const entryMap = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      map.set(`${e.accountId}-${e.month}`, e.amount);
    });
    return map;
  }, [entries]);

  return (
    <>
      {accounts.map((account) => (
        <TableRow key={account.id}>
          <TableCell className="font-medium sticky z-10 left-0 bg-background border-r">
            {account.name}
          </TableCell>
          <TableCell className="text-center text-muted-foreground text-xs">
            {account.currency}
          </TableCell>
          {MONTHS.map((_, index) => {
            const month = index + 1;
            const amount = entryMap.get(`${account.id}-${month}`);
            return (
              <TableCell key={month} className="text-right p-0">
                <div className="h-full w-full">
                  <AccountCell
                    accountId={account.id}
                    month={month}
                    amount={amount}
                    onEntryChange={onEntryChange}
                  />
                </div>
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

const AccountCell = memo(
  ({ accountId, month, amount, onEntryChange }: AccountCellProps) => {
    const handleChange = useCallback(
      (value: number) => {
        return onEntryChange(accountId, month, value);
      },
      [accountId, month, onEntryChange]
    );

    return <EditableCell value={amount} onChange={handleChange} />;
  }
);
AccountCell.displayName = "AccountCell";
