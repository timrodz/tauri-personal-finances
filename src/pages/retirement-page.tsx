import { PageContainer } from "@/components/page-container";
import { PageTitle } from "@/components/page-title";
import { RetirementPlannerFeature } from "@/features/retirement-planner/retirement-planner-feature";

export function RetirementPage() {
  return (
    <PageContainer>
      <PageTitle>Retirement planner</PageTitle>
      <RetirementPlannerFeature />
    </PageContainer>
  );
}
