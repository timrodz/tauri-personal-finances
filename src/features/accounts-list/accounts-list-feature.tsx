import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountFormFeature } from "@/features/accounts/account-form-feature";
import { api } from "@/lib/api";
import { emitAccountsChanged } from "@/lib/events";
import type { Account } from "@/lib/types/accounts";
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
import { PlusIcon } from "lucide-react";
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
  const [showArchived, setShowArchived] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch all accounts to know if we have archived ones
      const data = await api.getAllAccounts(true);
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const visibleAccounts = accounts.filter((a) => showArchived || !a.isArchived);
  const hasArchivedAccounts = accounts.some((a) => a.isArchived);
  const refreshAccounts = useCallback(() => {
    fetchAccounts();
    emitAccountsChanged();
  }, [fetchAccounts]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAccount(id);
      refreshAccounts();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const handleToggleArchive = async (id: string) => {
    try {
      await api.toggleArchiveAccount(id);
      refreshAccounts();
    } catch (error) {
      console.error("Failed to toggle archive:", error);
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
  }, [fetchAccounts]);

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Your Accounts</h3>
          {hasArchivedAccounts && (
            <div className="flex items-center space-x-2 border px-3 py-1.5 rounded-md">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="text-sm cursor-pointer">
                Show archived
              </Label>
            </div>
          )}
        </div>
        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              emitAccountsChanged();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="mr-2 size-4" />
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
                refreshAccounts();
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
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sub-category</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleAccounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No accounts found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={visibleAccounts.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {visibleAccounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      isEditing={editingAccount?.id === account.id}
                      onEditStart={() => setEditingAccount(account)}
                      onEditEnd={() => setEditingAccount(null)}
                      onDelete={handleDelete}
                      onToggleArchive={handleToggleArchive}
                      onRefresh={refreshAccounts}
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
