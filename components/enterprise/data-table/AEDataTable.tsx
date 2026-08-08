import { ReactNode } from "react";

interface AEDataTableProps {
  toolbar?: ReactNode;
  children: ReactNode;
}

export default function AEDataTable({
  toolbar,
  children,
}: AEDataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {toolbar}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          {children}
        </table>
      </div>
    </div>
  );
}