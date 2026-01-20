import { OnboardingFeature } from "@/features/onboarding/onboarding-feature";
import { useOnboarding } from "@/hooks/use-onboarding";
import { BalanceSheetPage } from "@/pages/BalanceSheetPage";
import { HomePage } from "@/pages/HomePage";
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
    return <OnboardingFeature />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/balance-sheets/:year" element={<BalanceSheetPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
