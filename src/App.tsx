import { useOnboarding } from "@/hooks/use-onboarding";
import { AnalyticsPage } from "@/pages/analytics-page";
import { BalanceSheetPage } from "@/pages/balance-sheet-page";
import { HomePage } from "@/pages/home-page";
import { OnboardingPage } from "@/pages/onboarding-page";
import { RetirementPage } from "@/pages/retirement-page";
import { AppLayout } from "@/components/app-layout";
import { useMemo } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

function App() {
  const { isLoading: isOnboardingLoading, data: onboardingStatus } =
    useOnboarding();

  const isOnboardingCompleted = useMemo(() => {
    if (!onboardingStatus) return false;
    return onboardingStatus.every((step) => step.isCompleted);
  }, [onboardingStatus]);

  if (isOnboardingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isOnboardingCompleted) {
    return <OnboardingPage />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="retirement" element={<RetirementPage />} />
          <Route path="balance-sheets/:year" element={<BalanceSheetPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
