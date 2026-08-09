import {
  UserPlus,
  UserCog,
} from "lucide-react";

import { getRecentActivity } from "@/modules/dashboard/services/recent-activity.service";

export default async function RecentActivity() {
  const activity = await getRecentActivity();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-[#03162F]">
        Recent Activity
      </h2>

      {activity.length === 0 ? (
        <div className="py-8 text-center text-slate-500">
          No recent activity.
        </div>
      ) : (
        <div className="space-y-4">
          {activity.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-start gap-4 rounded-xl border border-slate-100 p-4"
            >
              <div className="rounded-full bg-slate-100 p-2">
                {item.type === "employee" ? (
                  <UserCog className="h-5 w-5 text-[#03162F]" />
                ) : (
                  <UserPlus className="h-5 w-5 text-[#03162F]" />
                )}
              </div>

              <div className="flex-1">
                <p className="font-medium">
                  {item.title}
                </p>

                <p className="text-sm text-slate-500">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}