import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivateValue } from "@/components/ui/private-value";
import { formatCurrency } from "@/lib/currency-formatting";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  TrendingUpIcon,
} from "lucide-react";

interface NetWorthKPIsProps {
  currentNetWorth: number;
  momGrowth: number;
  totalAssets: number;
  assetGrowth?: number;
  totalLiabilities: number;
  liabilityGrowth?: number;
  homeCurrency: string;
  periodLabel?: string;
}

export function NetWorthKPIs({
  currentNetWorth,
  momGrowth,
  totalAssets,
  assetGrowth,
  totalLiabilities,
  liabilityGrowth,
  homeCurrency,
  periodLabel = "from last month",
}: NetWorthKPIsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
          <TrendingUpIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <PrivateValue
              value={formatCurrency(currentNetWorth, homeCurrency)}
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <span
              className={
                momGrowth > 0
                  ? "text-chart-2 flex items-center"
                  : momGrowth < 0
                    ? "text-destructive flex items-center"
                    : "text-muted-foreground flex items-center"
              }
            >
              {momGrowth > 0 ? (
                <ArrowUpRightIcon className="h-3 w-3 mr-1" />
              ) : momGrowth < 0 ? (
                <ArrowDownRightIcon className="h-3 w-3 mr-1" />
              ) : (
                <span className="mr-1">-</span>
              )}
              <PrivateValue value={`${Math.abs(momGrowth).toFixed(1)}%`} />
            </span>
            <span className="ml-1">{periodLabel}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <PrivateValue value={formatCurrency(totalAssets, homeCurrency)} />
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {assetGrowth !== undefined && (
              <span
                className={
                  assetGrowth > 0
                    ? "text-chart-2 flex items-center"
                    : assetGrowth < 0
                      ? "text-destructive flex items-center"
                      : "text-muted-foreground flex items-center"
                }
              >
                {assetGrowth > 0 ? (
                  <ArrowUpRightIcon className="h-3 w-3 mr-1" />
                ) : assetGrowth < 0 ? (
                  <ArrowDownRightIcon className="h-3 w-3 mr-1" />
                ) : (
                  <span className="mr-1">-</span>
                )}
                <PrivateValue value={`${Math.abs(assetGrowth).toFixed(1)}%`} />
              </span>
            )}
            <span className="ml-1">{periodLabel}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Liabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <PrivateValue
              value={formatCurrency(totalLiabilities, homeCurrency)}
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {liabilityGrowth !== undefined && (
              <span
                className={
                  liabilityGrowth > 0 // Growth in liabilities is usually bad (red)
                    ? "text-destructive flex items-center"
                    : liabilityGrowth < 0
                      ? "text-chart-2 flex items-center"
                      : "text-muted-foreground flex items-center"
                }
              >
                {liabilityGrowth > 0 ? (
                  <ArrowUpRightIcon className="h-3 w-3 mr-1" />
                ) : liabilityGrowth < 0 ? (
                  <ArrowDownRightIcon className="h-3 w-3 mr-1" />
                ) : (
                  <span className="mr-1">-</span>
                )}
                <PrivateValue
                  value={`${Math.abs(liabilityGrowth).toFixed(1)}%`}
                />
              </span>
            )}
            <span className="ml-1">{periodLabel}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
