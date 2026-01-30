import { CurrencySelect } from "@/components/currency-select";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InformationTooltip } from "@/components/ui/information-tooltip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { getSubCategoriesByAccountType } from "@/lib/categories";
import {
  accountFormSchema,
  type AccountFormValues,
  getAccountFormDefaults,
} from "@/lib/types/account";
import type { Account } from "@/lib/types/accounts";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface AccountFormProps {
  onComplete: () => void;
  initialValues?: Account;
  defaultCurrency?: string;
}

export function AccountFormFeature({
  onComplete,
  initialValues,
  defaultCurrency,
}: AccountFormProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: getAccountFormDefaults({
      initialValues,
      defaultCurrency,
    }),
    mode: "onChange",
  });

  const accountType = form.watch("accountType");
  const subCategory = form.watch("subCategory");

  useEffect(() => {
    form.reset(
      getAccountFormDefaults({
        initialValues,
        defaultCurrency,
      }),
    );
    setError(null);
  }, [defaultCurrency, form, initialValues]);

  useEffect(() => {
    if (!subCategory) {
      return;
    }
    const validOptions = getSubCategoriesByAccountType(accountType);
    const isValid = validOptions.some((opt) => opt.key === subCategory);
    if (!isValid) {
      form.setValue("subCategory", null, { shouldValidate: true });
    }
  }, [accountType, form, subCategory]);

  const handleSubmit = async (values: AccountFormValues) => {
    setError(null);
    try {
      if (initialValues) {
        await api.updateAccount(
          initialValues.id,
          values.name,
          values.accountType,
          values.currency,
          values.subCategory ?? null,
        );
      } else {
        await api.createAccount(
          values.name,
          values.accountType,
          values.currency,
          values.subCategory ?? null,
        );
      }
      onComplete();
    } catch (err) {
      console.error("Failed to save account:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const isEditing = !!initialValues;
  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
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
            <FieldLabel htmlFor="account-name">Account name</FieldLabel>
            <Input
              {...field}
              id="account-name"
              aria-invalid={fieldState.invalid}
              placeholder="e.g. KiwiBank"
              autoFocus
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="accountType"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Type</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asset">Asset</SelectItem>
                  <SelectItem value="Liability">Liability</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="currency"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <CurrencySelect
                label="Currency"
                value={field.value}
                onValueChange={field.onChange}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        name="subCategory"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>
              Sub-category
              <InformationTooltip>
                Useful for generating reports based on account breakdown
              </InformationTooltip>
            </FieldLabel>
            <Select
              value={field.value ?? "none"}
              onValueChange={(val) =>
                field.onChange(val === "none" ? null : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sub-category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {getSubCategoriesByAccountType(accountType).map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !form.formState.isValid}
      >
        {isSubmitting && (
          <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isEditing ? "Update Account" : "Create Account"}
      </Button>
    </form>
  );
}
