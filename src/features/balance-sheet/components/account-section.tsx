import { TableCell, TableRow } from "@/components/ui/table";
import { MONTHS } from "@/lib/constants/time";
import type { Account } from "@/lib/types/accounts";
import type { Entry } from "@/lib/types/balance-sheets";
import { cn } from "@/lib/utils";
import { memo, useCallback, useMemo } from "react";
import { EditableCell } from "./editable-cell";

interface AccountSectionProps {
  accounts: Account[];
  entries: Entry[];
  onEntryChange: (
    accountId: string,
    month: number,
    amount: number,
  ) => Promise<void>;
  maxEditableMonth: number;
}

interface AccountCellProps {
  accountId: string;
  month: number;
  amount: number | undefined;
  currency: string;
  onEntryChange: (
    accountId: string,
    month: number,
    amount: number,
  ) => Promise<void>;
  disabled?: boolean;
}

export function AccountSection({
  accounts,
  entries,
  onEntryChange,
  maxEditableMonth,
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
            const isDisabled = month > maxEditableMonth;
            return (
              <TableCell
                key={month}
                className={cn("text-right p-0", isDisabled && "bg-muted/10")}
              >
                <div className="h-full w-full">
                  <AccountCell
                    accountId={account.id}
                    month={month}
                    amount={amount}
                    currency={account.currency}
                    onEntryChange={onEntryChange}
                    disabled={isDisabled}
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
  ({
    accountId,
    month,
    amount,
    currency,
    onEntryChange,
    disabled = false,
  }: AccountCellProps) => {
    const handleChange = useCallback(
      (value: number) => {
        return onEntryChange(accountId, month, value);
      },
      [accountId, month, onEntryChange],
    );

    return (
      <EditableCell
        value={amount}
        currency={currency}
        onChange={handleChange}
        disabled={disabled}
      />
    );
  },
);
AccountCell.displayName = "AccountCell";
