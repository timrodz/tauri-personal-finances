import { PRIVACY_MODE_VALUE } from "@/lib/constants";

export function toPrivateValue(
  value: string | number | null | undefined,
  isPrivacyMode: boolean,
): string {
  if (isPrivacyMode) return PRIVACY_MODE_VALUE;
  if (value === null || value === undefined) return "";
  return value.toString();
}
