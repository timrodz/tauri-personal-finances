import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { UserSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserSettingsForm } from "@/features/user-settings-form/user-settings-form";
import { AccountsList } from "@/features/accounts/accounts-list";

interface DashboardProps {
  settings: UserSettings;
  onSettingsUpdated: () => void;
}

export function Dashboard({ settings, onSettingsUpdated }: DashboardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b pt-4">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Personal Finances</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              Hello, {settings.name}
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
                <UserSettingsForm
                  onComplete={() => {
                    onSettingsUpdated();
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

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Net Worth Card Placeholder */}
          <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">
              Net Worth
            </h3>
            <p className="text-2xl font-bold mt-2">
              $0.00 {settings.homeCurrency}
            </p>
          </div>
        </div>

        <section className="mt-12">
          <AccountsList homeCurrency={settings.homeCurrency} />
        </section>
      </main>
    </div>
  );
}
