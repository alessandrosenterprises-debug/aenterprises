import { ReactNode } from "react";

export default function CardHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 px-6 py-4">
      {children}
    </div>
  );
}