import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface YearSelectorProps {
  existingYears: number[];
  value?: number;
  onChange: (year: number) => void;
  disabled?: boolean;
}

export function YearSelector({
  existingYears,
  value,
  onChange,
  disabled = false,
}: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  // Range: 5 years back, up to current year
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const availableYears = years.filter((y) => !existingYears.includes(y));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="year-select">Select Year</Label>
        <Select
          value={value?.toString()}
          onValueChange={(value) => onChange(parseInt(value, 10))}
          disabled={disabled || availableYears.length === 0}
        >
          <SelectTrigger id="year-select">
            <SelectValue placeholder="Select a year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
            {availableYears.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No new years available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
