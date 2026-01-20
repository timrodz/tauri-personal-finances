import { PRIVACY_MODE_VALUE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePrivacy } from "@/providers/privacy-provider";

interface PrivateValueProps {
  value: string | number;
  className?: string;
  mask?: string;
}

export function PrivateValue({
  value,
  className,
  mask = PRIVACY_MODE_VALUE,
}: PrivateValueProps) {
  const { isPrivacyMode } = usePrivacy();

  if (isPrivacyMode) {
    return <span className={cn("font-mono", className)}>{mask}</span>;
  }

  return <span className={className}>{value}</span>;
}
