"use client";

import {
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

interface AERowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AERowActions({
  onView,
  onEdit,
  onDelete,
}: AERowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onView}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
        title="View"
      >
        <Eye size={18} />
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
        title="Edit"
      >
        <Pencil size={18} />
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        title="Delete"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}