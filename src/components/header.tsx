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

interface HeaderProps {
  title: string;
  navigateBack?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Header(props: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { data: settings, refetch: refetchSettings } = useUserSettings();

  return (
    <div className="header-container">
      <header className="mx-auto px-2 flex items-center justify-between">
        <div>{/* Empty div so the settings are on the left menu */}</div>
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
      <MainNav />
    </div>
  );
}
