import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusLabels, type Locale, type OrderStatusKey } from "@/lib/i18n";

const styles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100/80 text-amber-800 border-amber-200",
  CONFIRMED: "bg-blue-100/80 text-blue-800 border-blue-200",
  PREPARING: "bg-purple-100/80 text-purple-800 border-purple-200",
  READY: "bg-cyan-100/80 text-cyan-800 border-cyan-200",
  SHIPPED: "bg-indigo-100/80 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-red-100/80 text-red-800 border-red-200"
};

export function StatusBadge({
  status,
  className,
  locale = "en"
}: {
  status: OrderStatus;
  className?: string;
  locale?: Locale;
}) {
  return (
    <Badge className={cn("px-3 py-0.5 text-xs font-bold border", styles[status], className)}>
      {statusLabels[locale][status as OrderStatusKey]}
    </Badge>
  );
}
