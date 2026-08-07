export default function BusinessStatus() {
  const businesses = [
    "Alessandro Elite Fashion",
    "Alessandro Classic Barbershop",
    "Alessandro Mobile Money",
    "Alessandro Soft Loans",
    "Alessandro Tech Solutions",
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-[#03162F]">
        Business Status
      </h2>

      <div className="space-y-4">
        {businesses.map((business) => (
          <div
            key={business}
            className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
          >
            <span className="font-medium">{business}</span>

            <span className="h-3 w-3 rounded-full bg-green-500" />
          </div>
        ))}
      </div>
    </div>
  );
}