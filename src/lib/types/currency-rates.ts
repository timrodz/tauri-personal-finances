export interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  provider: string;
  rate: number;
  month: number;
  year: number;
  timestamp: string;
}
