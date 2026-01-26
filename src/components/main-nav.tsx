import { cn } from "@/lib/utils";
import { ChartPieIcon, HomeIcon, SproutIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", end: true, icon: HomeIcon },
  { to: "/analytics", label: "Analytics", icon: ChartPieIcon },
  { to: "/retirement", label: "Retirement Planner", icon: SproutIcon },
];

export function MainNav() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
