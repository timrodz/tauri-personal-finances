import { FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/constants/currencies";

interface CurrencySelectProps {
  homeCurrency?: string;
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export function CurrencySelect({
  homeCurrency,
  value,
  onValueChange,
  label,
  disabled = false,
}: CurrencySelectProps) {
  return (
    <>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Select
        defaultValue={homeCurrency}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
