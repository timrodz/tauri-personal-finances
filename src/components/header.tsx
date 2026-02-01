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
import { useUserSettings } from "@/hooks/use-user-settings";
import { usePrivacy } from "@/providers/privacy-provider";
import { EyeIcon, EyeOffIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { MainNav } from "./main-nav";

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { data: settings, refetch: refetchSettings } = useUserSettings();

  return (
    <header className="border-b mx-auto px-4 py-2.5 flex items-center justify-between">
      <MainNav />
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">
          {settings?.name ? `Hello, ${settings.name}` : "Hello"}
        </span>
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
                refetchSettings();
                setSettingsOpen(false);
              }}
              initialValues={{
                name: settings?.name ?? "",
                homeCurrency: settings?.homeCurrency ?? "",
                theme: settings?.theme ?? "system",
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
