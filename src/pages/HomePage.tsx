import { Header } from "@/components/header";
import { MainNav } from "@/components/main-nav";
import { DashboardFeature } from "@/features/dashboard/dashboard-feature";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header title="Dashboard" />
      <MainNav />
      <main className="flex-1 overflow-auto p-4 w-full">
        <DashboardFeature />
      </main>
    </div>
  );
}
