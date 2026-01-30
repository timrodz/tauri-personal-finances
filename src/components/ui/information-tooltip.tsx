import { InfoIcon } from "lucide-react";
import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InformationIconProps extends React.ComponentProps<"button"> {
  label?: string;
  children: React.ReactNode;
}

export function InformationTooltip({
  label = "More info",
  className,
  children,
  ...props
}: InformationIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex size-5 items-center justify-center text-muted-foreground transition hover:text-foreground",
            className,
          )}
          {...props}
        >
          <InfoIcon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-xs">
        <span>{children}</span>
      </TooltipContent>
    </Tooltip>
  );
}
