import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Account, api } from "@/lib/api";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AccountFormFeature } from "../accounts/account-form-feature";
import { AccountRow } from "./components/account-row";

interface AccountsListProps {
  homeCurrency: string;
}

export function AccountsListFeature({ homeCurrency }: AccountsListProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAllAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAccount(id);
      fetchAccounts();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  if (loading && accounts.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Loading accounts...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Accounts</h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>
                Create a new account to track your finances.
              </DialogDescription>
            </DialogHeader>
            <AccountFormFeature
              defaultCurrency={homeCurrency}
              onComplete={() => {
                setIsAddOpen(false);
                fetchAccounts();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center h-24 text-muted-foreground"
                >
                  No accounts found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  isEditing={editingAccount?.id === account.id}
                  onEditStart={() => setEditingAccount(account)}
                  onEditEnd={() => setEditingAccount(null)}
                  onDelete={handleDelete}
                  onRefresh={fetchAccounts}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
