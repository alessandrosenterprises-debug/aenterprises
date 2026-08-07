interface WelcomeBannerProps {
  profile: {
    display_name: string;
    email: string;
    roles?: {
      name: string;
    }[];
  } | null;
}

export default function WelcomeBanner({
  profile,
}: WelcomeBannerProps) {
  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

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
          {greeting},
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          {profile?.display_name ?? "Welcome"}
        </h1>

        <p className="mt-3 text-lg text-slate-300">
          {profile?.roles?.[0]?.name ?? "Enterprise Overview"}
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