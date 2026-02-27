import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function CFInput({ error, className = "", ...props }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <input className={`cf-input ${className}`} {...props} />
      {error && (
        <span style={{ fontSize: 12, color: "var(--cf-danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}