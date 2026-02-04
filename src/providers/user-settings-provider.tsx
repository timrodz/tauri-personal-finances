import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserSettingsFormFeature } from "@/features/user-settings-form/user-settings-form-feature";
import { USER_SETTINGS_KEYS, useUserSettings } from "@/hooks/use-user-settings";
import { queryClient } from "@/lib/react-query";
import type { UserSettings } from "@/lib/types/user-settings";
import { createContext, ReactNode, useContext } from "react";

type UserSettingsContextValue = {
  settings: UserSettings;
  refresh: () => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(
  undefined,
);

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-muted-foreground animate-pulse">Loading...</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unable to load settings</CardTitle>
          <CardDescription>
            We hit a snag while fetching your preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry} className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsRequired({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-none sm:border-solid">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Finish your setup
          </CardTitle>
          <CardDescription className="text-center text-md">
            Add your preferences to unlock the rest of the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserSettingsFormFeature onComplete={() => onComplete()} />
        </CardContent>
      </Card>
    </div>
  );
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading, error, refetch } = useUserSettings();

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: USER_SETTINGS_KEYS.all });
    await refetch();
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState onRetry={() => void refresh()} />;
  }

  if (!settings) {
    return <SettingsRequired onComplete={() => void refresh()} />;
  }

  return (
    <UserSettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettingsContext() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error(
      "useUserSettingsContext must be used within a UserSettingsProvider",
    );
  }
  return context;
}
