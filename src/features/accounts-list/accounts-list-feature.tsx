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
import { AccountFormFeature } from "@/features/accounts/account-form-feature";
import { Account, api } from "@/lib/api";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AccountRow } from "./components/account-row";

interface AccountsListProps {
  homeCurrency: string;
}

export function AccountsListFeature({ homeCurrency }: AccountsListProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setAccounts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Update order in background
        api.updateAccountOrder(newOrder.map((a) => a.id)).catch((error) => {
          console.error("Failed to update account order:", error);
          // Rollback if needed or notify user
          fetchAccounts();
        });

        return newOrder;
      });
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
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
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No accounts found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={accounts.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {accounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      isEditing={editingAccount?.id === account.id}
                      onEditStart={() => setEditingAccount(account)}
                      onEditEnd={() => setEditingAccount(null)}
                      onDelete={handleDelete}
                      onRefresh={fetchAccounts}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </div>
      </DndContext>
    </div>
  );
}
