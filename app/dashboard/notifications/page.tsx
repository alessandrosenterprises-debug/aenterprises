import {
  Bell,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Notifications
        </h1>

        <p className="mt-1 text-slate-500">
          View important updates and system notifications.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="py-10 text-center">
          <Bell className="mx-auto h-12 w-12 text-slate-300" />

          <h2 className="mt-4 text-xl font-bold text-[#03162F]">
            No notifications
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            New system notifications, pending actions and
            important updates will appear here.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              Pending
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-500">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}