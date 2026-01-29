import z from "zod/v3";

import type { Account } from "@/lib/types/accounts";

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Account name is required."),
  accountType: z.enum(["Asset", "Liability"]),
  subCategory: z
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .optional(),
  currency: z.string().trim().min(1, "Currency is required."),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountFormDefaultsOptions {
  initialValues?: Account;
  defaultCurrency?: string;
}

export function getAccountFormDefaults({
  initialValues,
  defaultCurrency,
}: AccountFormDefaultsOptions): Partial<AccountFormValues> {
  if (!initialValues && !defaultCurrency) return {};
  if (defaultCurrency && !initialValues) {
    return {
      currency: defaultCurrency,
    };
  }
  if (!initialValues) return {};
  return {
    name: initialValues.name,
    accountType: initialValues.accountType,
    subCategory: initialValues.subCategory,
    currency: initialValues.currency,
  };
}
