import { Header } from "@/components/header";
import { PageContainer } from "@/components/page-container";
import { DashboardFeature } from "@/features/dashboard/dashboard-feature";

export function HomePage() {
  return (
    <PageContainer>
      <Header title="Home" />
      <main>
        <DashboardFeature />
      </main>
    </PageContainer>
  );
}
