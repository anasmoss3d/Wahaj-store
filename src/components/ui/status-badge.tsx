import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { statusLabels, type Locale, type OrderStatusKey } from "@/lib/i18n";

const styles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PREPARING: "bg-violet-50 text-violet-700",
  READY: "bg-cyan-50 text-cyan-700",
  SHIPPED: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700"
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
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", styles[status], className)}>
      {statusLabels[locale][status as OrderStatusKey]}
    </span>
  );
}
