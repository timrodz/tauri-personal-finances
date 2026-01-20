import { Button } from "@/components/ui/button";
import { YearSelector } from "@/components/year-selector";
import { api } from "@/lib/api";
import { RefreshCwIcon } from "lucide-react";
import { useState } from "react";

interface StepBalanceSheetProps {
  onComplete: () => void;
}

export function StepBalanceSheet({ onComplete }: StepBalanceSheetProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.createBalanceSheet(year);
      onComplete();
    } catch (error) {
      console.error("Failed to create balance sheet:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <YearSelector existingYears={[]} value={year} onChange={setYear} />

      <p className="text-sm text-muted-foreground">
        Creating a balance sheet for {year} will allow you to track your assets
        and liabilities month by month.
      </p>

      <Button className="w-full" onClick={handleCreate} disabled={loading}>
        {loading && <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />}
        Create Balance Sheet & Finish
      </Button>
    </div>
  );
}
