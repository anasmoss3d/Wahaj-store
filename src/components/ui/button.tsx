import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B85A2D]/25 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#B85A2D] text-white shadow-pill hover:bg-[#9E4A22] active:scale-[0.98]",
        primary: "bg-[#B85A2D] text-white shadow-pill hover:bg-[#9E4A22] active:scale-[0.98]",
        terracotta: "bg-[#B85A2D] text-white shadow-pill hover:bg-[#9E4A22] active:scale-[0.98]",
        secondary: "bg-[#1C1917] text-white shadow-sm hover:bg-[#2E2825] active:scale-[0.98]",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]",
        danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]",
        outline: "border border-[#DED7CB] bg-white/80 text-[#1C1917] hover:bg-[#F4EFEB] hover:border-[#B85A2D] active:scale-[0.98]",
        ghost: "bg-transparent text-[#1C1917] hover:bg-[#F2ECE4]/80",
        link: "text-[#B85A2D] underline-offset-4 hover:underline"
      },
      size: {
        default: "min-h-11 px-5 py-2",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export function ButtonLink({
  className,
  variant = "primary",
  size,
  children,
  href,
  ...props
}: React.PropsWithChildren<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    variant?: VariantProps<typeof buttonVariants>["variant"];
    size?: VariantProps<typeof buttonVariants>["size"];
  }
>) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      href={href}
      {...props}
    >
      {children}
    </Link>
  );
}

export { Button, buttonVariants };
