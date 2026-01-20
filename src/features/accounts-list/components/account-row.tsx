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
import { AccountFormFeature } from "@/features/accounts/account-form-feature";
import { Account } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Edit2Icon,
  GripVerticalIcon,
  Trash2Icon,
} from "lucide-react";

interface AccountRowProps {
  account: Account;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onDelete: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onRefresh: () => void;
}

export function AccountRow({
  account,
  isEditing,
  onEditStart,
  onEditEnd,
  onDelete,
  onToggleArchive,
  onRefresh,
}: AccountRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "bg-muted",
        account.isArchived && "opacity-50 grayscale",
      )}
    >
      <TableCell className="w-[40px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Drag handle</span>
        </Button>
      </TableCell>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={onEditStart}
                disabled={account.isArchived}
              >
                <Edit2Icon className="h-4 w-4" />
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

          {account.isArchived ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Unarchive">
                  <ArchiveRestoreIcon className="h-4 w-4" />
                  <span className="sr-only">Unarchive</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unarchive Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`Are you sure you want to unarchive "${account.name}"? It will be shown in your lists again.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onToggleArchive(account.id)}
                  >
                    Unarchive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="ArchiveIcon">
                  <ArchiveIcon className="h-4 w-4" />
                  <span className="sr-only">ArchiveIcon</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ArchiveIcon Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`Are you sure you want to archive "${account.name}"? It will be hidden from your lists by default but still included in calculations.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onToggleArchive(account.id)}
                  >
                    ArchiveIcon
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2Icon className="h-4 w-4" />
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
