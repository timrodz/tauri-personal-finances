import { Header } from "@/components/header";
import { MainNav } from "@/components/main-nav";
import { AnalyticsFeature } from "@/features/analytics/analytics-feature";

export function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header title="Analytics" />
      <MainNav />
      <main className="flex-1 overflow-auto p-4 w-full">
        <AnalyticsFeature />
      </main>
    </div>
  );
}
