import { CurrencySelect } from "@/components/currency-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { Theme } from "@/lib/types";
import { useTheme } from "@/providers/theme-provider";
import { useState } from "react";

interface UserSettingsFormProps {
  onComplete: () => void;
  initialValues?: {
    name: string;
    currency: string;
    theme: Theme;
  };
}

export function UserSettingsFormFeature({
  onComplete,
  initialValues,
}: UserSettingsFormProps) {
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(initialValues?.name || "");
  const [currency, setCurrency] = useState(initialValues?.currency || "USD");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await api.updateUserSettings(name, currency, theme);
      onComplete();
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialValues;

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          placeholder="e.g. Tim"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <CurrencySelect
            label="Home Currency"
            value={currency}
            onValueChange={setCurrency}
          />
        </div>

        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={(val: Theme) => setTheme(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        This will be the base currency for your net worth calculations.
      </p>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !name.trim()}
      >
        {isEditing
          ? loading
            ? "Saving..."
            : "Save Changes"
          : loading
            ? "Saving..."
            : "Get Started"}
      </Button>
    </form>
  );

  if (isEditing) {
    return FormContent;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-none sm:border-solid">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome
          </CardTitle>
          <CardDescription>
            {`Let's get setup first. How should we address you and what's your
            primary currency?`}
          </CardDescription>
        </CardHeader>
        <CardContent>{FormContent}</CardContent>
      </Card>
    </div>
  );
}
