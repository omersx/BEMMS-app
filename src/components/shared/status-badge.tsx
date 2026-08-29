import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Status = "active" | "inactive" | "archived" | "invited" | "suspended" | "deactivated" | string | null | undefined;

interface StatusBadgeProps {
  status?: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const displayStatus = status || "unknown";
  const normalizedStatus = displayStatus.toLowerCase();

  let variant: "default" | "secondary" | "destructive" | "outline" = "default";

  switch (normalizedStatus) {
    case "active":
      variant = "default";
      break;
    case "inactive":
    case "invited":
      variant = "secondary";
      break;
    case "archived":
      variant = "outline";
      break;
    case "suspended":
    case "deactivated":
      variant = "destructive";
      break;
    default:
      variant = "secondary";
  }

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {displayStatus}
    </Badge>
  );
}
