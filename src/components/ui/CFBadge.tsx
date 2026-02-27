import React from "react";

type Variant = "default" | "success";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

export function CFBadge({
  variant = "default",
  className = "",
  children,
  ...props
}: Props) {
  const variantClass =
    variant === "success" ? "cf-badge-success" : "";

  return (
    <span className={`cf-badge ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
}