import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "carbon-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "carbon-button--primary text-[var(--background)]",
        accent: "carbon-button--accent text-white",
        secondary: "carbon-button--secondary text-[var(--foreground)]",
        ghost: "carbon-button--ghost text-[var(--muted-foreground)]",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-14 px-7 text-base",
        icon: "carbon-button--icon size-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export function Button({
  className,
  variant,
  size,
  asChild,
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot className={classes} aria-busy={loading || undefined} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span className="carbon-button__spinner" aria-hidden="true" />
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
