import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import {
  Account,
  BalanceSheet,
  CurrencyRate,
  Entry,
  UserSettings,
} from "./types";

export function useBalanceSheets() {
  const [data, setData] = useState<BalanceSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalanceSheets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sheets = await api.getBalanceSheets();
      setData(sheets);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalanceSheets();
  }, [fetchBalanceSheets]);

  return { data, loading, error, refetch: fetchBalanceSheets };
}

export function useUserSettings() {
  const [data, setData] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await api.getUserSettings();
      setData(settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { data, loading, error, refetch: fetchSettings };
}

export function useAccounts() {
  const [data, setData] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const accounts = await api.getAllAccounts();
      setData(accounts);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { data, loading, error, refetch: fetchAccounts };
}

export function useCreateBalanceSheet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBalanceSheet = async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.createBalanceSheet(year);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate: createBalanceSheet, loading, error };
}

export function useEntries(balanceSheetId: string | undefined) {
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!balanceSheetId) return;
    setLoading(true);
    setError(null);
    try {
      const entries = await api.getEntries(balanceSheetId);
      setData(entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [balanceSheetId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { data, loading, error, refetch: fetchEntries, setData };
}

export function useUpsertEntry() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertEntry = async (
    balanceSheetId: string,
    accountId: string,
    month: number,
    amount: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.upsertEntry(
        balanceSheetId,
        accountId,
        month,
        amount
      );
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate: upsertEntry, loading, error };
}

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
    rate: number,
    month: number,
    year: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.upsertCurrencyRate(
        id,
        fromCurrency,
        toCurrency,
        rate,
        month,
        year
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
