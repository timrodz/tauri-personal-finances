import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InformationTooltip } from "@/components/ui/information-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLatestNetWorth } from "@/hooks/use-net-worth";
import { useRetirementPlans } from "@/hooks/use-retirement-plans";
import {
  getScenarioLimitMessage,
  isScenarioLimitReached,
} from "@/lib/retirement";
import {
  retirementProjectionFormSchema,
  type RetirementPlan,
  type retirementProjectionFormValues,
} from "@/lib/types/retirement";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface InputFormProps {
  homeCurrency: string;
  onProjectionValuesChange: (
    values: retirementProjectionFormValues | null,
  ) => void;
  loadPlan: RetirementPlan | null;
}

export function InputForm({
  homeCurrency,
  onProjectionValuesChange,
  loadPlan,
}: InputFormProps) {
  const { data: latestNetWorth } = useLatestNetWorth();

  const {
    data: savedPlans,
    isLoading: savedPlansLoading,
    createPlan,
  } = useRetirementPlans();

  const [saveNotice, setSaveNotice] = useState<{
    type: "success" | "error" | "limit";
    message: string;
  } | null>(null);

  const [useYear, setUseYear] = useState(true);

  const scenarioCount = savedPlans?.length ?? 0;
  const scenarioLimitReached = isScenarioLimitReached(scenarioCount);
  const scenarioLimitMessage = getScenarioLimitMessage(scenarioCount);

  const form = useForm<retirementProjectionFormValues>({
    resolver: zodResolver(retirementProjectionFormSchema),
    defaultValues: {
      planName: "",
      targetRetirementYear: 2026,
      startingNetWorth: 0,
      monthlyContribution: 0,
      expectedMonthlyExpenses: 0,
      inflationRate: 2,
      returnScenario: "moderate",
    },
    mode: "onChange",
  });

  // Pre-fill starting net worth from latest snapshot
  useEffect(() => {
    if (!latestNetWorth?.netWorth) {
      return;
    }
    form.setValue("startingNetWorth", latestNetWorth.netWorth, {
      shouldValidate: true,
    });
  }, [latestNetWorth, form]);

  // Load plan into form
  useEffect(() => {
    if (!loadPlan) {
      return;
    }
    const targetRetirementYear = loadPlan.targetRetirementDate
      ? new Date(loadPlan.targetRetirementDate).getFullYear()
      : undefined;
    const values = {
      planName: loadPlan.name,
      targetRetirementYear,
      startingNetWorth: loadPlan.startingNetWorth,
      monthlyContribution: loadPlan.monthlyContribution,
      expectedMonthlyExpenses: loadPlan.expectedMonthlyExpenses,
      inflationRate: loadPlan.inflationRate * 100,
      returnScenario: loadPlan.returnScenario,
    };
    form.reset(values);
    onProjectionValuesChange(values);
    setSaveNotice(null);
  }, [loadPlan, form]);

  const handleSubmit = () => {
    const values = form.getValues();
    onProjectionValuesChange({
      ...values,
      inflationRate: values.inflationRate / 100,
      targetRetirementYear:
        useYear && values.targetRetirementYear
          ? values.targetRetirementYear
          : undefined,
    });
  };

  const handleSavePlan = async () => {
    if (scenarioLimitReached) {
      setSaveNotice({
        type: "limit",
        message: scenarioLimitMessage ?? "Scenario limit reached.",
      });
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setSaveNotice(null);
    const values = form.getValues();

    try {
      await createPlan.mutateAsync({
        name: values.planName.trim(),
        targetRetirementYear:
          useYear && values.targetRetirementYear
            ? values.targetRetirementYear
            : null,
        startingNetWorth: values.startingNetWorth,
        monthlyContribution: values.monthlyContribution,
        expectedMonthlyExpenses: values.expectedMonthlyExpenses,
        returnScenario: values.returnScenario,
        inflationRate: values.inflationRate / 100,
      });
      setSaveNotice({
        type: "success",
        message: "Scenario saved successfully.",
      });
    } catch (error) {
      setSaveNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save the scenario right now.",
      });
    }
  };

  const saveDisabled =
    !form.formState.isValid ||
    createPlan.isPending ||
    savedPlansLoading ||
    scenarioLimitReached;

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">Build your retirement plan</CardTitle>
        <CardDescription>
          Enter your savings assumptions to preview how quickly you can reach
          your retirement goal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              name="planName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-plan-name">
                    Plan name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-plan-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="My first plan..."
                    autoCapitalize="on"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="targetRetirementYear"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="form-rhf-target-retirement-year"
                    className={cn(
                      useYear ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    Target year (optional)
                  </FieldLabel>
                  <Input
                    {...field}
                    {...form.register("targetRetirementYear", {
                      valueAsNumber: true,
                    })}
                    id="form-rhf-target-retirement-year"
                    type="number"
                    aria-invalid={fieldState.invalid}
                    className={cn(
                      useYear ? "text-foreground" : "text-muted-foreground",
                    )}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-year"
                      checked={useYear}
                      onCheckedChange={setUseYear}
                    />
                    <Label
                      htmlFor="use-year"
                      className="text-sm text-muted-foreground"
                    >
                      Use target year in projection
                    </Label>
                  </div>
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Controller
              name="startingNetWorth"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-starting-net-worth">
                    Starting net worth
                  </FieldLabel>
                  <Input
                    {...field}
                    {...form.register("startingNetWorth", {
                      valueAsNumber: true,
                    })}
                    id="form-rhf-starting-net-worth"
                    type="number"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="monthlyContribution"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-monthly-contributions">
                    Monthly contributions ({homeCurrency})
                  </FieldLabel>
                  <Input
                    {...field}
                    {...form.register("monthlyContribution", {
                      valueAsNumber: true,
                    })}
                    id="form-rhf-monthly-contributions"
                    type="number"
                    aria-invalid={fieldState.invalid}
                    placeholder="$1,000.00"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="expectedMonthlyExpenses"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-expected-monthly-expenses">
                    Expected monthly expenses ({homeCurrency})
                  </FieldLabel>
                  <Input
                    {...field}
                    {...form.register("expectedMonthlyExpenses", {
                      valueAsNumber: true,
                    })}
                    id="form-rhf-expected-monthly-expenses"
                    type="number"
                    aria-invalid={fieldState.invalid}
                    placeholder="$2,000.00"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              name="returnScenario"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Monthly contribution returns
                    <InformationTooltip>
                      {`Contributions are linked to investments, but in a real world scenario they also include savings.`}
                    </InformationTooltip>
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">
                        Conservative (4%)
                      </SelectItem>
                      <SelectItem value="moderate">Moderate (7%)</SelectItem>
                      <SelectItem value="aggressive">
                        Aggressive (10%)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="inflationRate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-inflation-rate">
                    Inflation rate percentage (%)
                    <InformationTooltip>
                      0% effectively ignores inflation.
                    </InformationTooltip>
                  </FieldLabel>
                  <Input
                    {...field}
                    {...form.register("inflationRate", { valueAsNumber: true })}
                    id="form-rhf-inflation-rate"
                    type="number"
                    aria-invalid={fieldState.invalid}
                    placeholder="2%"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Button type="submit" className="w-full">
              Generate projection
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleSavePlan}
              disabled={saveDisabled}
            >
              {createPlan.isPending
                ? "Saving plan..."
                : "Save plan from projections"}
            </Button>
          </div>
          {scenarioLimitReached && scenarioLimitMessage && (
            <p className="text-xs text-amber-600">{scenarioLimitMessage}</p>
          )}
          {saveNotice && (
            <p
              className={`text-xs ${
                saveNotice.type === "success"
                  ? "text-emerald-600"
                  : saveNotice.type === "error"
                    ? "text-destructive"
                    : "text-amber-600"
              }`}
            >
              {saveNotice.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
