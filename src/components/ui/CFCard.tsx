import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function CFCard({ className = "", children, ...props }: Props) {
  return (
    <div className={`cf-card ${className}`} {...props}>
      {children}
    </div>
  );
}