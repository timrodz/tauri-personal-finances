import { Header } from "@/components/header";
import { PageContainer } from "@/components/page-container";
import { AnalyticsFeature } from "@/features/analytics/analytics-feature";

export function AnalyticsPage() {
  return (
    <PageContainer>
      <Header />
      <main>
        <AnalyticsFeature />
      </main>
    </PageContainer>
  );
}
