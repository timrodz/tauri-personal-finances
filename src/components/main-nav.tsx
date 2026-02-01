import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";

export function MainNav() {
  return (
    <nav className="flex flex-wrap gap-1">
      {/* {navigateBack && (
          <NavLink to={navigateBack} className="nav-link nav-link-hover">
            <ArrowLeftIcon className="size-4" />
            Back
          </NavLink>
        )} */}
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "nav-link",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "nav-link-hover",
            )
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
