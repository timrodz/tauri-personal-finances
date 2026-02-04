import { api } from "@/lib/api";
import { queryClient } from "@/lib/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";

export const CURRENCY_RATE_KEYS = {
  all: ["currencyRates"] as const,
  byYear: (year: number) => [...CURRENCY_RATE_KEYS.all, year] as const,
};

export function useCurrencyRates(year?: number) {
  return useQuery({
    queryKey: year ? CURRENCY_RATE_KEYS.byYear(year) : CURRENCY_RATE_KEYS.all,
    queryFn: () => api.getCurrencyRates(),
    select: (rates) => (year ? rates.filter((r) => r.year === year) : rates),
  });
}

export function useUpsertCurrencyRate() {
  return useMutation({
    mutationFn: ({
      id,
      fromCurrency,
      toCurrency,
      provider,
      rate,
      month,
      year,
    }: {
      id: string | null;
      fromCurrency: string;
      toCurrency: string;
      provider: string;
      rate: number;
      month: number;
      year: number;
    }) =>
      api.upsertCurrencyRate(
        id,
        fromCurrency,
        toCurrency,
        provider,
        rate,
        month,
        year,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CURRENCY_RATE_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: CURRENCY_RATE_KEYS.byYear(variables.year),
      });
    },
  });
}
