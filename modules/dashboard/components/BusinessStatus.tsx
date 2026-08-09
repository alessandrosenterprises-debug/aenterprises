import { getBusinessStatus } from "@/modules/dashboard/services/business-status.service";

export default async function BusinessStatus() {
  const businesses = await getBusinessStatus();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-[#03162F]">
        Business Status
      </h2>

      <div className="space-y-4">
        {businesses.length === 0 ? (
          <div className="rounded-xl border border-slate-100 p-4 text-center text-slate-500">
            No businesses found.
          </div>
        ) : (
          businesses.map((business) => (
            <div
              key={business.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
            >
              <span className="font-medium">
                {business.name}
              </span>

              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${
                    business.active
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                />

                <span className="text-sm text-slate-500">
                  {business.active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}