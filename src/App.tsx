import { api } from "@/lib/api";
import { UserSettings } from "@/lib/types";
import { BalanceSheetPage } from "@/pages/BalanceSheetPage";
import { ThemeProvider } from "@/providers/theme-provider";
import { useCallback, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { UserSettingsFormFeature } from "./features/user-settings-form/user-settings-form-feature";
import { HomePage } from "./pages/HomePage";

// Placeholder components
const Settings = () => (
  <div className="p-8">
    <h1>Settings</h1>
  </div>
);

function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSettings = useCallback(async () => {
    try {
      const userSettings = await api.getUserSettings();
      setSettings(userSettings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSettings();
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground animate-pulse">Loading...</div>
        </div>
      ) : !settings ? (
        <UserSettingsFormFeature onComplete={() => checkSettings()} />
      ) : (
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage settings={settings} checkSettings={checkSettings} />
              }
            />
            <Route
              path="/balance-sheets/:year"
              element={<BalanceSheetPage />}
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      )}
    </ThemeProvider>
  );
}

export default App;
