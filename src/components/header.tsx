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
import { api } from "@/lib/api";
import { usePrivacy } from "@/providers/privacy-provider";
import { useUserSettingsContext } from "@/providers/user-settings-provider";
import { EyeIcon, EyeOffIcon, RefreshCwIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { MainNav } from "./main-nav";

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { settings, refresh } = useUserSettingsContext();

  const handleSyncExchangeRates = async () => {
    setIsSyncing(true);
    try {
      await api.syncExchangeRates();
      await refresh();
    } catch (error) {
      console.error("Failed to sync exchange rates:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="border-b mx-auto px-4 py-2.5 flex items-center justify-between">
      <MainNav />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">
          {settings.name ? `Hello, ${settings.name}` : "Hello"}
        </span>
        {settings.needsExchangeSync && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSyncExchangeRates}
            disabled={isSyncing}
          >
            {isSyncing && (
              <RefreshCwIcon className="mr-2 size-4 animate-spin" />
            )}
            {isSyncing ? "Syncing rates..." : "Sync exchange rates"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePrivacyMode}
          title={isPrivacyMode ? "Show numbers" : "Hide numbers"}
        >
          {isPrivacyMode ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
          <span className="sr-only">
            {isPrivacyMode ? "Show numbers" : "Hide numbers"}
          </span>
        </Button>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <SettingsIcon className="size-4" />
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
                void refresh();
                setSettingsOpen(false);
              }}
              initialValues={{
                name: settings.name,
                homeCurrency: settings.homeCurrency,
                theme: settings.theme ?? "system",
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
