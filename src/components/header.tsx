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
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  navigateBack?: string;
}

export function Header({ title, navigateBack }: HeaderProps) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { data: settings, refetch: refetchSettings } = useUserSettings();

  return (
    <header className="border-b pt-4">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {navigateBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(navigateBack)}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

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
              <EyeOffIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
            <span className="sr-only">
              {isPrivacyMode ? "Show numbers" : "Hide numbers"}
            </span>
          </Button>
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
                  name: settings?.name ?? "",
                  currency: settings?.homeCurrency ?? "",
                  theme: settings?.theme ?? "system",
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
