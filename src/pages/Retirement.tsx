import { Header } from "@/components/header";
import { MainNav } from "@/components/main-nav";

export function RetirementPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header title="Retirement Planner" />
      <MainNav />
      <main className="flex-1 overflow-auto p-6 w-full">
        <div className="container mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Plan your future</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The retirement planner experience is coming next. You will be able
              to model savings, compare scenarios, and track projected income.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
