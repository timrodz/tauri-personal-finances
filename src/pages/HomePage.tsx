import { Header } from "@/components/header";
import { DashboardFeature } from "@/features/dashboard/dashboard-feature";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header title="Dashboard" />
      <main className="flex-1 overflow-auto p-4 w-full">
        <DashboardFeature />
      </main>
    </div>
  );
}
