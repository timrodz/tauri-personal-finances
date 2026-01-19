import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import { Account } from "@/lib/api";
import { Edit2, Trash2 } from "lucide-react";
import { AccountFormFeature } from "../../accounts/account-form-feature";

interface AccountRowProps {
  account: Account;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function AccountRow({
  account,
  isEditing,
  onEditStart,
  onEditEnd,
  onDelete,
  onRefresh,
}: AccountRowProps) {
  return (
    <TableRow key={account.id}>
      <TableCell className="font-medium">{account.name}</TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            account.accountType === "Asset"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {account.accountType}
        </span>
      </TableCell>
      <TableCell>{account.currency}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Dialog
            open={isEditing}
            onOpenChange={(open) => !open && onEditEnd()}
          >
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onEditStart}>
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Account</DialogTitle>
                <DialogDescription>
                  Modify your account details.
                </DialogDescription>
              </DialogHeader>
              <AccountFormFeature
                initialValues={account}
                onComplete={() => {
                  onEditEnd();
                  onRefresh();
                }}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  {`This will permanently delete the account "${account.name}". This action cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(account.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
