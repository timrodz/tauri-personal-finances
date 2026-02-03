export interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  provider: string;
  rate: number;
  month: number; // 1-12
  year: number;
  timestamp: string;
}
