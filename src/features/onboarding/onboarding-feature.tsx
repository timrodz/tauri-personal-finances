import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useUserSettings } from "@/hooks/use-user-settings";
import { StepAccount } from "./steps/step-account";
import { StepBalanceSheet } from "./steps/step-balance-sheet";
import { StepSettings } from "./steps/step-settings";

export function OnboardingFeature() {
  const { data: status, isLoading, refetch } = useOnboarding();
  const { data: settings, refetch: refetchSettings } = useUserSettings();

  if (isLoading) return null;
  if (!status) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading onboarding...
        </div>
      </div>
    );
  }

  const currentStep = status.find((s) => !s.isCompleted);

  // If all completed, this component shouldn't be rendered by App.tsx anyway,
  // but we add a fallback just in case.
  if (!currentStep) {
    return null;
  }

  const handleComplete = async () => {
    await refetch();
    await refetchSettings();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-none sm:border-solid">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            {currentStep.stepKey === "CONFIGURE_SETTINGS" &&
              "Welcome to Oink! 🐽"}
            {currentStep.stepKey === "CREATE_FIRST_ACCOUNT" &&
              "Let's add your first account"}
            {currentStep.stepKey === "CREATE_FIRST_BALANCE_SHEET" &&
              "Create your first balance sheet"}
          </CardTitle>
          <CardDescription className="text-center text-md">
            {currentStep.stepKey === "CONFIGURE_SETTINGS" &&
              "Let's get you sorted, one piggy at a time."}
            {currentStep.stepKey === "CREATE_FIRST_ACCOUNT" &&
              "To track your net worth, we need at least one account."}
            {currentStep.stepKey === "CREATE_FIRST_BALANCE_SHEET" &&
              "Select the year you'd like to start tracking from."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep.stepKey === "CONFIGURE_SETTINGS" && (
            <StepSettings onComplete={handleComplete} />
          )}
          {currentStep.stepKey === "CREATE_FIRST_ACCOUNT" &&
            settings?.homeCurrency && (
              <StepAccount
                onComplete={handleComplete}
                homeCurrency={settings.homeCurrency}
              />
            )}
          {currentStep.stepKey === "CREATE_FIRST_BALANCE_SHEET" && (
            <StepBalanceSheet onComplete={handleComplete} />
          )}

          <div className="mt-8 flex justify-center gap-1">
            {status.map((step) => (
              <div
                key={step.stepKey}
                className={`h-1.5 w-full rounded-full transition-colors ${
                  step.isCompleted
                    ? "bg-primary"
                    : step.stepKey === currentStep.stepKey
                      ? "bg-primary/40"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
