"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("group/field-group flex w-full flex-col gap-4", className)}
      {...props}
    />
  );
}

const fieldVariants = cva("group/field flex w-full gap-1.5", {
  variants: {
    orientation: {
      vertical: "flex-col [&>*]:w-full",
      horizontal: "flex-row items-center [&>[data-slot=field-label]]:flex-auto"
    }
  },
  defaultVariants: {
    orientation: "vertical"
  }
});

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("flex w-fit items-center gap-2 leading-snug text-[#1C1917]", className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-xs leading-relaxed font-light text-[#665E57] [&>a]:font-medium [&>a]:text-[#B85A2D] [&>a]:underline-offset-4 [&>a:hover]:underline",
        className
      )}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  if (!children) {
    return (
      <div
        data-slot="field-separator"
        data-content={false}
        className={cn("py-1", className)}
        {...props}
      >
        <Separator />
      </div>
    );
  }

  return (
    <div
      data-slot="field-separator"
      data-content={true}
      className={cn("relative my-1 h-5 text-xs text-[#8C827A]", className)}
      {...props}
    >
      <Separator className="absolute inset-x-0 top-1/2" />
      <span
        className="relative mx-auto block w-fit bg-[#F7F4EE] px-3 text-[#78716C]"
        data-slot="field-separator-content"
      >
        {children}
      </span>
    </div>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldSeparator
};
