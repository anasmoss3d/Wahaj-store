"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface AnchorRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipProviderContextValue {
  delayDuration: number;
}

const TooltipProviderContext = React.createContext<TooltipProviderContextValue>({
  delayDuration: 0
});

function TooltipProvider({
  delayDuration = 0,
  children
}: {
  delayDuration?: number;
  skipDelayDuration?: number;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ delayDuration }), [delayDuration]);
  return (
    <TooltipProviderContext.Provider value={value}>
      {children}
    </TooltipProviderContext.Provider>
  );
}

interface TooltipContextValue {
  open: boolean;
  disabled: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  anchorRect: AnchorRect | null;
  setAnchorRect: (rect: AnchorRect | null) => void;
  tooltipId: string;
  delayDuration: number;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function readRect(node: HTMLElement | null): AnchorRect | null {
  if (!node) return null;
  const r = node.getBoundingClientRect();
  return {
    top: r.top,
    right: r.right,
    bottom: r.bottom,
    left: r.left,
    width: r.width,
    height: r.height
  };
}

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  delayDuration: delayProp,
  disabled = false,
  children
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { delayDuration: providerDelay } = React.useContext(
    TooltipProviderContext
  );
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [anchorRect, setAnchorRect] = React.useState<AnchorRect | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const tooltipId = React.useId();

  const open = disabled ? false : (openProp ?? uncontrolledOpen);
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (disabled) {
        if (openProp === undefined) setUncontrolledOpen(false);
        return;
      }
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [disabled, openProp, onOpenChange]
  );

  React.useEffect(() => {
    if (!open || disabled) return;
    const handleReposition = () => {
      setAnchorRect(readRect(triggerRef.current));
    };
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, disabled]);

  const value = React.useMemo(
    () => ({
      open,
      disabled,
      setOpen,
      triggerRef,
      anchorRect,
      setAnchorRect,
      tooltipId,
      delayDuration: delayProp ?? providerDelay
    }),
    [open, disabled, setOpen, anchorRect, tooltipId, delayProp, providerDelay]
  );

  return (
    <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
  );
}

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    }
  };
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  render?: React.ReactElement;
}

const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(
  (
    {
      asChild = false,
      render,
      children,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const ctx = React.useContext(TooltipContext);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = React.useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    React.useEffect(() => clearTimer, [clearTimer]);

    const show = React.useCallback(() => {
      clearTimer();
      if (!ctx || ctx.disabled) return;
      const openNow = () => {
        ctx.setAnchorRect(readRect(ctx.triggerRef.current));
        ctx.setOpen(true);
      };
      if (ctx.delayDuration > 0) {
        timerRef.current = setTimeout(openNow, ctx.delayDuration);
      } else {
        openNow();
      }
    }, [clearTimer, ctx]);

    const hide = React.useCallback(() => {
      clearTimer();
      ctx?.setOpen(false);
    }, [clearTimer, ctx]);

    const mergedRef = mergeRefs(ref, ctx?.triggerRef);

    const triggerProps = {
      ...props,
      "aria-describedby": ctx?.open && !ctx.disabled ? ctx.tooltipId : undefined,
      onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
        onMouseEnter?.(event);
        show();
      },
      onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
        onMouseLeave?.(event);
        hide();
      },
      onFocus: (event: React.FocusEvent<HTMLElement>) => {
        onFocus?.(event);
        show();
      },
      onBlur: (event: React.FocusEvent<HTMLElement>) => {
        onBlur?.(event);
        hide();
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
        onKeyDown?.(event);
        if (event.key === "Escape") hide();
      }
    };

    if (React.isValidElement(render)) {
      const renderChildren =
        children ?? (render.props as { children?: React.ReactNode }).children;
      return (
        <Slot ref={mergedRef} {...triggerProps}>
          {React.cloneElement(
            render as React.ReactElement<{ children?: React.ReactNode }>,
            undefined,
            renderChildren
          )}
        </Slot>
      );
    }

    if (asChild) {
      return (
        <Slot ref={mergedRef} {...triggerProps}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={mergedRef as React.Ref<HTMLButtonElement>}
        type="button"
        {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

const emptySubscribe = () => () => {};

function useIsClient() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  hidden?: boolean;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      className,
      side = "top",
      align = "center",
      sideOffset = 8,
      hidden = false,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const ctx = React.useContext(TooltipContext);
    const isClient = useIsClient();
    const rect = ctx?.anchorRect;

    if (!isClient || !ctx?.open || ctx.disabled || hidden || !rect) {
      return null;
    }

    let top = 0;
    let left = 0;

    if (side === "right") {
      left = rect.right + sideOffset;
      top =
        align === "start"
          ? rect.top
          : align === "end"
            ? rect.bottom
            : rect.top + rect.height / 2;
    } else if (side === "left") {
      left = rect.left - sideOffset;
      top =
        align === "start"
          ? rect.top
          : align === "end"
            ? rect.bottom
            : rect.top + rect.height / 2;
    } else if (side === "bottom") {
      top = rect.bottom + sideOffset;
      left =
        align === "start"
          ? rect.left
          : align === "end"
            ? rect.right
            : rect.left + rect.width / 2;
    } else {
      top = rect.top - sideOffset;
      left =
        align === "start"
          ? rect.left
          : align === "end"
            ? rect.right
            : rect.left + rect.width / 2;
    }

    const transformClass =
      side === "right"
        ? align === "start"
          ? ""
          : align === "end"
            ? "-translate-y-full"
            : "-translate-y-1/2"
        : side === "left"
          ? align === "start"
            ? "-translate-x-full"
            : align === "end"
              ? "-translate-x-full -translate-y-full"
              : "-translate-x-full -translate-y-1/2"
          : side === "bottom"
            ? align === "start"
              ? ""
              : align === "end"
                ? "-translate-x-full"
                : "-translate-x-1/2"
            : align === "start"
              ? "-translate-y-full"
              : align === "end"
                ? "-translate-x-full -translate-y-full"
                : "-translate-x-1/2 -translate-y-full";

    return createPortal(
      <div
        ref={ref}
        id={ctx.tooltipId}
        role="tooltip"
        data-slot="tooltip-content"
        data-side={side}
        style={{ top, left, ...style }}
        className={cn(
          "pointer-events-none fixed z-50 w-max max-w-xs whitespace-nowrap rounded-lg border border-[#2A2622] bg-[#1C1917] px-2.5 py-1.5 text-xs font-medium text-[#FAF8F5] shadow-md",
          transformClass,
          className
        )}
        {...props}
      >
        {children}
      </div>,
      document.body
    );
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
