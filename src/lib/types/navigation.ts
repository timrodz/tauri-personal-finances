import { LucideIcon } from "lucide-react";

export interface NavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}
