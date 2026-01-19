import { CurrencySelect } from "@/components/currency-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Account, api } from "@/lib/api";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface AccountFormProps {
  onComplete: () => void;
  initialValues?: Account;
  defaultCurrency?: string;
}

export function AccountFormFeature({
  onComplete,
  initialValues,
  defaultCurrency = "USD",
}: AccountFormProps) {
  const [name, setName] = useState(initialValues?.name || "");
  const [accountType, setAccountType] = useState<"Asset" | "Liability">(
    initialValues?.accountType || "Asset",
  );
  const [currency, setCurrency] = useState(
    initialValues?.currency || defaultCurrency,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      if (initialValues) {
        await api.updateAccount(initialValues.id, name, accountType, currency);
      } else {
        await api.createAccount(name, accountType, currency);
      }
      onComplete();
    } catch (err) {
      console.error("Failed to save account:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialValues;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {error && (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="account-name">Account Name</Label>
        <Input
          id="account-name"
          placeholder="e.g. Main Checking"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={accountType}
            onValueChange={(val: "Asset" | "Liability") => setAccountType(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asset">Asset</SelectItem>
              <SelectItem value="Liability">Liability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CurrencySelect
          label="Currency"
          value={currency}
          onValueChange={setCurrency}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !name.trim()}
      >
        {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? "Update Account" : "Create Account"}
      </Button>
    </form>
  );
}
