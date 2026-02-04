import { PageContainer } from "@/components/page-container";
import { PageTitle } from "@/components/page-title";
import { DashboardFeature } from "@/features/dashboard/dashboard-feature";

export function HomePage() {
  return (
    <PageContainer>
      <PageTitle>Home</PageTitle>
      <DashboardFeature />
    </PageContainer>
  );
}
