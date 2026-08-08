interface AEStatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  Active:
    "bg-green-100 text-green-700 border border-green-200",

  Inactive:
    "bg-red-100 text-red-700 border border-red-200",

  Pending:
    "bg-yellow-100 text-yellow-700 border border-yellow-200",
};

export default function AEStatusBadge({
  status,
}: AEStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
        statusStyles[status] ??
        "bg-slate-100 text-slate-700 border border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}