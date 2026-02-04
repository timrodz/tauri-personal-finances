import { api } from "@/lib/api";
import { queryClient } from "@/lib/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";

export const ACCOUNT_KEYS = {
  all: ["accounts"] as const,
  byArchived: (includeArchived: boolean) =>
    [...ACCOUNT_KEYS.all, includeArchived] as const,
};

export function useAccounts(includeArchived: boolean = false) {
  return useQuery({
    queryKey: ACCOUNT_KEYS.byArchived(includeArchived),
    queryFn: () => api.getAllAccounts(includeArchived),
  });
}

export function useToggleArchiveAccount() {
  return useMutation({
    mutationFn: (id: string) => api.toggleArchiveAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all });
    },
  });
}
