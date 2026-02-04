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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteBalanceSheet } from "@/hooks/use-balance-sheets";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface DangerZoneProps {
  balanceSheetId: string;
  year: number;
}

export function DangerZone({ balanceSheetId, year }: DangerZoneProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutateAsync: deleteBalanceSheet } = useDeleteBalanceSheet();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBalanceSheet(balanceSheetId);
      navigate("/");
    } catch (e) {
      console.error("Failed to delete balance sheet:", e);
      setIsDeleting(false);
    }
  };
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Delete this balance sheet</p>
            <p className="text-sm text-muted-foreground">
              Once deleted, all data for {year} will be permanently removed.
              This action cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2Icon />
                {isDeleting ? "Deleting..." : "Delete Balance Sheet"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the {year} balance sheet and all
                  its entries. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Trash2Icon />
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
