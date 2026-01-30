import z from "zod/v3";

import type { Theme } from "@/lib/types/theme";

export interface UserSettings {
  id: string;
  name: string;
  homeCurrency: string;
  theme: Theme;
  createdAt: string;
  updatedAt: string;
}

export const userSettingsFormSchema = z.object({
  name: z.string().trim().min(1, "Your name is required."),
  homeCurrency: z.string().trim().min(1, "Home currency is required."),
  theme: z.enum(["light", "dark", "system"]),
});

export type UserSettingsFormValues = z.infer<typeof userSettingsFormSchema>;

interface UserSettingsFormDefaultsOptions {
  initialValues?: Pick<UserSettings, "name" | "homeCurrency" | "theme">;
  defaultCurrency?: string;
  defaultTheme?: Theme;
}

export function getUserSettingsFormDefaults({
  initialValues,
  defaultCurrency,
  defaultTheme,
}: UserSettingsFormDefaultsOptions): Partial<UserSettingsFormValues> {
  if (!initialValues && !defaultCurrency && !defaultTheme) {
    return {};
  }
  if (defaultCurrency && !initialValues) {
    return {
      homeCurrency: defaultCurrency,
      theme: defaultTheme ?? "system",
    };
  }
  if (!initialValues) {
    return {
      theme: defaultTheme ?? "system",
    };
  }
  return {
    name: initialValues.name,
    homeCurrency: initialValues.homeCurrency,
    theme: initialValues.theme ?? defaultTheme ?? "system",
  };
}
