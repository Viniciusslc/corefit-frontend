import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ paddingTop: 80 }}>
      {children}
    </div>
  );
}
