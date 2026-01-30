import { Header } from "@/components/header";
import { PageContainer } from "@/components/page-container";
import { RetirementPlannerFeature } from "@/features/retirement-planner/retirement-planner-feature";

export function RetirementPage() {
  return (
    <PageContainer>
      <Header title="Retirement Planner" />
      <main>
        <RetirementPlannerFeature />
      </main>
    </PageContainer>
  );
}
