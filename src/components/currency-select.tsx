import { FieldLabel } from "@/components/ui/field";
import { InformationTooltip } from "@/components/ui/information-tooltip";
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
      {label && (
        <FieldLabel>
          {label}
          <InformationTooltip>
            {`The home currency will serve the base for your net worth calculations. If your currency is not found, please get in touch with support@timrodz.dev so we can sort you out`}
          </InformationTooltip>
        </FieldLabel>
      )}
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
