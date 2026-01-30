import { SectionAccounts } from "./components/section-accounts";
import { SectionBalanceSheets } from "./components/section-balance-sheets";
import { SectionNetWorth } from "./components/section-net-worth";

export function DashboardFeature() {
  return (
    <div className="space-y-4">
      <SectionNetWorth />
      <SectionBalanceSheets />
      <SectionAccounts />
    </div>
  );
}
