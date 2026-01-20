import { AccountsListFeature } from "@/features/accounts-list/accounts-list-feature";
import { useUserSettings } from "@/hooks/use-user-settings";

export function SectionAccounts() {
  const { data: settings } = useUserSettings();

  if (!settings) return null;

  return (
    <section>
      <AccountsListFeature homeCurrency={settings.homeCurrency} />
    </section>
  );
}
