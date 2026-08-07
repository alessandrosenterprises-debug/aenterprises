export default function WelcomeBanner() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#03162F] to-[#0A2852] p-8 text-white lg:flex-row lg:items-center">
      <div>
        <p className="text-lg text-slate-300">
          Good Afternoon,
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Alessandro
        </h1>

        <p className="mt-3 text-lg text-slate-300">
          Enterprise Overview
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm text-slate-300">
          Today
        </p>

        <h3 className="text-xl font-semibold">
          {today}
        </h3>
      </div>
    </div>
  );
}