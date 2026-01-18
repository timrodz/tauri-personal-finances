import { DashboardFeature } from "@/features/dashboard/dashboard-feature";
import { UserSettings } from "@/lib/types";

interface HomePageProps {
  settings: UserSettings;
  checkSettings: () => void;
}

export function HomePage({ settings, checkSettings }: HomePageProps) {
  return (
    <DashboardFeature settings={settings} onSettingsUpdated={checkSettings} />
  );
}
