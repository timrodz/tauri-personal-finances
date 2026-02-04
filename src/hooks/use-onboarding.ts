import { api } from "@/lib/api";
import { queryClient } from "@/lib/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";

export const ONBOARDING_KEYS = {
  all: ["onboardingStatus"] as const,
};

export function useOnboarding() {
  const query = useQuery({
    queryKey: ONBOARDING_KEYS.all,
    queryFn: () => api.getOnboardingStatus(),
  });

  const completeStep = useMutation({
    mutationFn: (stepKey: string) => api.completeOnboardingStep(stepKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_KEYS.all });
    },
  });

  return {
    ...query,
    completeStep,
  };
}
