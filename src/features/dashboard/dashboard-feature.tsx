import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserSettingsFormFeature } from "@/features/user-settings-form/user-settings-form-feature";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

import { useUserSettings } from "@/hooks/use-user-settings";
import { SectionAccounts } from "./components/section-accounts";
import { SectionBalanceSheets } from "./components/section-balance-sheets";
import { SectionNetWorth } from "./components/section-net-worth";

export function DashboardFeature() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Data Fetching
  const { data: settings, refetch: refetchSettings } = useUserSettings();

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b pt-4">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              {settings?.name ? `Hello, ${settings.name}` : "Hello"}
            </span>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <SettingsIcon className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>
                    Update your personal preferences.
                  </DialogDescription>
                </DialogHeader>
                <UserSettingsFormFeature
                  onComplete={() => {
                    refetchSettings();
                    setSettingsOpen(false);
                  }}
                  initialValues={{
                    name: settings.name,
                    currency: settings.homeCurrency,
                    theme: settings.theme,
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        <SectionNetWorth />
        <SectionBalanceSheets />
        <SectionAccounts />
      </main>
    </div>
  );
}
