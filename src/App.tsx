import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { UserSettings } from "@/lib/types";
import { UserSettingsForm } from "./features/user-settings-form/user-settings-form";
import { ThemeProvider } from "@/providers/theme-provider";
import { Dashboard } from "@/features/dashboard/dashboard";

// Placeholder components
const BalanceSheets = () => (
  <div className="p-8">
    <h1>Balance Sheets</h1>
  </div>
);
const Settings = () => (
  <div className="p-8">
    <h1>Settings</h1>
  </div>
);

function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSettings = async () => {
    try {
      const userSettings = await api.getUserSettings();
      setSettings(userSettings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
        <UserSettingsForm onComplete={() => checkSettings()} />
      ) : (
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  settings={settings}
                  onSettingsUpdated={checkSettings}
                />
              }
            />
            <Route path="/balance-sheets" element={<BalanceSheets />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      )}
    </ThemeProvider>
  );
}

export default App;
