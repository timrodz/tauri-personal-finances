import { PageContainer } from "@/components/page-container";
import { PageTitle } from "@/components/page-title";
import { AnalyticsFeature } from "@/features/analytics/analytics-feature";

export function AnalyticsPage() {
  return (
    <PageContainer>
      <PageTitle>Analytics</PageTitle>
      <AnalyticsFeature />
    </PageContainer>
  );
}
