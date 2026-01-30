import { CurrencySelect } from "@/components/currency-select";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Theme } from "@/lib/types/theme";
import {
  getUserSettingsFormDefaults,
  userSettingsFormSchema,
  type UserSettingsFormValues,
} from "@/lib/types/user-settings";
import { useTheme } from "@/providers/theme-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface UserSettingsFormProps {
  onComplete: () => void;
  initialValues?: Pick<
    UserSettingsFormValues,
    "name" | "homeCurrency" | "theme"
  >;
}

export function UserSettingsFormFeature({
  onComplete,
  initialValues,
}: UserSettingsFormProps) {
  const { theme, setTheme } = useTheme();

  const [error, setError] = useState<string | null>(null);

  const form = useForm<UserSettingsFormValues>({
    resolver: zodResolver(userSettingsFormSchema),
    defaultValues: getUserSettingsFormDefaults({
      initialValues,
      defaultCurrency: "USD",
      defaultTheme: theme,
    }),
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(
      getUserSettingsFormDefaults({
        initialValues,
        defaultCurrency: "USD",
        defaultTheme: theme,
      }),
    );
    setError(null);
  }, [form, initialValues]);

  const handleSubmit = async (values: UserSettingsFormValues) => {
    try {
      await api.updateUserSettings(
        values.name,
        values.homeCurrency,
        values.theme,
      );
      onComplete();
    } catch (error) {
      console.error("Failed to save settings:", error);
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const isEditing = !!initialValues;
  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name" aria-required>
              Your name
            </FieldLabel>
            <Input
              {...field}
              id="name"
              aria-invalid={fieldState.invalid}
              placeholder="e.g. Warren Buffet"
              autoFocus
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="homeCurrency"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <CurrencySelect
                label="Home Currency"
                value={field.value}
                onValueChange={field.onChange}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="theme"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Theme</FieldLabel>
              <Select
                value={field.value}
                onValueChange={(val: Theme) => {
                  field.onChange(val);
                  setTheme(val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !form.formState.isValid}
      >
        {isSubmitting
          ? "Saving..."
          : isEditing
            ? "Save Changes"
            : "Get Started"}
      </Button>
    </form>
  );
}
