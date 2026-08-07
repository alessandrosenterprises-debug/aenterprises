import { ReactNode } from "react";

export default function CardFooter({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="border-t border-gray-100 px-6 py-4">
      {children}
    </div>
  );
}