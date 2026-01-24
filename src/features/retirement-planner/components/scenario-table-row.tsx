import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/currency-formatting";
import { RetirementPlan, RetirementProjection } from "@/lib/types";
import { Trash2Icon } from "lucide-react";
import { getProjectionErrorKind } from "../lib/projection";

export interface ScenarioRowData {
  plan: RetirementPlan;
  projection: RetirementProjection | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

interface ScenarioTableRowProps {
  row: ScenarioRowData;
  isLoaded: boolean;
  isEarliest: boolean;
  isHighestIncome: boolean;
  homeCurrency: string;
  onLoad: (plan: RetirementPlan) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function ScenarioTableRow({
  row,
  isLoaded,
  isEarliest,
  isHighestIncome,
  homeCurrency,
  onLoad,
  onDelete,
  isDeleting,
}: ScenarioTableRowProps) {
  const scenarioErrorKind = getProjectionErrorKind(row.error);
  const scenarioErrorLabel =
    scenarioErrorKind === "notAchievable" ? "Not achievable" : "Unavailable";

  const formatScenarioDate = (projectedRetirementDate: string | null) => {
    if (!projectedRetirementDate) {
      return "Already achievable";
    }

    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(projectedRetirementDate));
  };

  return (
    <TableRow
      className={`cursor-pointer transition-colors ${
        isLoaded ? "bg-sky-50" : "hover:bg-muted/40"
      }`}
      onClick={() => onLoad(row.plan)}
    >
      <TableCell className="max-w-[220px] whitespace-normal">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{row.plan.name}</span>
            {isLoaded && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                Loaded
              </span>
            )}
            {isEarliest && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Earliest
              </span>
            )}
            {isHighestIncome && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                Top income
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {row.plan.returnScenario.charAt(0).toUpperCase() +
              row.plan.returnScenario.slice(1)}{" "}
            · {formatCurrencyCompact(row.plan.startingNetWorth, homeCurrency)}{" "}
            starting
          </p>
        </div>
      </TableCell>
      <TableCell>
        {row.isLoading && (
          <span className="text-xs text-muted-foreground">Calculating...</span>
        )}
        {row.isError && (
          <span className="text-xs text-amber-600">{scenarioErrorLabel}</span>
        )}
        {!row.isLoading && row.projection && (
          <span>
            {formatScenarioDate(row.projection.projectedRetirementDate)}
          </span>
        )}
        {!row.isLoading && !row.projection && !row.isError && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </TableCell>
      <TableCell>
        {row.isLoading && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
        {row.isError && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
        {!row.isLoading && row.projection && (
          <span>{row.projection.yearsToRetirement.toFixed(1)}</span>
        )}
        {!row.isLoading && !row.projection && !row.isError && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </TableCell>
      <TableCell>
        {row.isLoading && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
        {row.isError && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
        {!row.isLoading && row.projection && (
          <span>
            {formatCurrency(row.projection.monthlyIncome3pct, homeCurrency)}
          </span>
        )}
        {!row.isLoading && !row.projection && !row.isError && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </TableCell>
      <TableCell>
        {row.isLoading && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
        {row.isError && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
        {!row.isLoading && row.projection && (
          <span>
            {formatCurrency(row.projection.monthlyIncome4pct, homeCurrency)}
          </span>
        )}
        {!row.isLoading && !row.projection && !row.isError && (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(row.plan.id);
          }}
          disabled={isDeleting}
        >
          <Trash2Icon className="h-4 w-4" />
          {isDeleting ? "Removing..." : "Delete"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
