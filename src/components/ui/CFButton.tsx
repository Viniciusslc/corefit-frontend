import React from "react";

type Variant = "primary" | "soft";
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function CFButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: Props) {
  const variantClass =
    variant === "primary" ? "cf-btn-primary" : "cf-btn-soft";

  const sizeClass =
    size === "sm"
      ? "px-2 py-1 text-sm"
      : size === "lg"
      ? "px-4 py-3 text-base"
      : "";

  return (
    <button
      className={`cf-btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}