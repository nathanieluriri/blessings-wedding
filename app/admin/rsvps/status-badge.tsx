import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_COLOR, STATUS_META, type RsvpStatus } from "@/lib/rsvp-status";

export default function StatusBadge({
  status,
  className,
}: {
  status: RsvpStatus;
  className?: string;
}) {
  return (
    <Badge
      className={cn("gap-1 border-transparent", STATUS_COLOR[status].chip, className)}
    >
      <span
        className={cn("size-1.5 rounded-full", STATUS_COLOR[status].dot)}
        aria-hidden
      />
      {STATUS_META[status].label}
    </Badge>
  );
}
