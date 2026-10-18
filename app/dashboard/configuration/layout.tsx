import { ReactNode } from "react";

export default function ConfigurationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-w-0 w-full">{children}</div>;
}
