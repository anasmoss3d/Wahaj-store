import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#B85A2D]/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#1C1917] text-white",
        secondary: "border-[#E8E2D8] bg-[#F4EFEB] text-[#57534E]",
        destructive: "border-red-200 bg-red-50 text-red-800",
        outline: "border-[#DED7CB] bg-white/80 text-[#1C1917]",
        teal: "border-[#CBD5C8] bg-[#E7ECE5] text-[#2F463B]",
        gold: "border-[#E5DDD0] bg-[#F2ECE4] text-[#9E4A22]",
        success: "border-[#CBD5C8] bg-[#E7ECE5] text-[#2F463B]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
