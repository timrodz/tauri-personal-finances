import { api } from "@/lib/api";
import { queryClient } from "@/lib/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";

export const BALANCE_SHEET_KEYS = {
  all: ["balanceSheets"] as const,
};

export const BALANCE_SHEET_ENTRY_KEYS = {
  all: ["balanceSheetEntries"] as const,
  bySheet: (balanceSheetId: string) =>
    [...BALANCE_SHEET_ENTRY_KEYS.all, balanceSheetId] as const,
};

export function useBalanceSheets() {
  return useQuery({
    queryKey: BALANCE_SHEET_KEYS.all,
    queryFn: () => api.getBalanceSheets(),
  });
}

export function useBalanceSheet(year: number | null | undefined) {
  const isValidYear = typeof year === "number" && Number.isFinite(year);
  return useQuery({
    queryKey: BALANCE_SHEET_KEYS.all,
    queryFn: () => api.getBalanceSheets(),
    select: (sheets) =>
      isValidYear ? sheets.find((sheet) => sheet.year === year) : undefined,
  });
}

export function useCreateBalanceSheet() {
  return useMutation({
    mutationFn: (year: number) => api.createBalanceSheet(year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BALANCE_SHEET_KEYS.all });
    },
  });
}

export function useDeleteBalanceSheet() {
  return useMutation({
    mutationFn: (id: string) => api.deleteBalanceSheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BALANCE_SHEET_KEYS.all });
    },
  });
}

export function useEntries(balanceSheetId: string) {
  return useQuery({
    queryKey: BALANCE_SHEET_ENTRY_KEYS.bySheet(balanceSheetId),
    queryFn: () => api.getEntries(balanceSheetId),
    enabled: Boolean(balanceSheetId),
  });
}

export function useUpsertEntry() {
  return useMutation({
    mutationFn: ({
      balanceSheetId,
      accountId,
      month,
      amount,
    }: {
      balanceSheetId: string;
      accountId: string;
      month: number;
      amount: number;
    }) => api.upsertEntry(balanceSheetId, accountId, month, amount),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: BALANCE_SHEET_ENTRY_KEYS.bySheet(variables.balanceSheetId),
      });
    },
  });
}
