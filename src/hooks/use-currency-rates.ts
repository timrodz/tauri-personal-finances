import { api } from "@/lib/api";
import { CurrencyRate } from "@/lib/types/currency-rates";
import { useState, useCallback, useEffect } from "react";

export function useCurrencyRates(year?: number) {
  const [data, setData] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allRates = await api.getCurrencyRates();
      if (year) {
        setData(allRates.filter((r) => r.year === year));
      } else {
        setData(allRates);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { data, loading, error, refetch: fetchRates, setData };
}

export function useUpsertCurrencyRate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertRate = async (
    id: string | null,
    fromCurrency: string,
    toCurrency: string,
    provider: string,
    rate: number,
    month: number,
    year: number,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.upsertCurrencyRate(
        id,
        fromCurrency,
        toCurrency,
        provider,
        rate,
        month,
        year,
      );
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate: upsertRate, loading, error };
}
