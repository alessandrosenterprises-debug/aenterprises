"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  CalendarDays,
  Cloud,
  CloudSun,
  FileText,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Users,
} from "lucide-react";

interface WelcomeBannerProps {
  profile: {
    display_name: string;
    email: string;
    role: string;
  } | null;

  forecast?: {
    bookings: number;
    revenue: number;
    newCustomers: number;
  };
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  sunrise: string;
  sunset: string;
}

function getWeatherDescription(code: number) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code))
    return "Partly cloudy";
  if ([45, 48].includes(code))
    return "Foggy";
  if ([51, 53, 55].includes(code))
    return "Drizzle";
  if ([61, 63, 65].includes(code))
    return "Rain";
  if ([71, 73, 75].includes(code))
    return "Snow";
  if ([80, 81, 82].includes(code))
    return "Rain showers";
  if ([95, 96, 99].includes(code))
    return "Thunderstorm";

  return "Mostly cloudy";
}

function formatMoney(amount: number) {
  return `ZMW ${amount.toFixed(2)}`;
}

function formatTime(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString(
    "en-ZM",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}

export default function WelcomeBanner({
  profile,
  forecast = {
    bookings: 0,
    revenue: 0,
    newCustomers: 0,
  },
}: WelcomeBannerProps) {
  /*
   * ---------------------------------------------------------
   * HYDRATION-SAFE CLOCK
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   * Do NOT initialize this with new Date().
   *
   * The server and browser can render at different seconds,
   * which causes a React hydration mismatch.
   *
   * We start with null and initialize the clock after
   * hydration inside useEffect().
   */

  const [now, setNow] =
    useState<Date | null>(null);

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * LIVE CLOCK
   * ---------------------------------------------------------
   */

  useEffect(() => {
    function updateClock() {
      setNow(new Date());
    }

    // Initialize AFTER hydration.
    updateClock();

    const interval = setInterval(
      updateClock,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * WEATHER
   * ---------------------------------------------------------
   */

  async function loadWeather() {
    try {
      setWeatherLoading(true);

      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=-15.3875&longitude=28.3228&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=sunrise,sunset&timezone=Africa%2FLusaka",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Weather request failed"
        );
      }

      const data = await response.json();

      setWeather({
        temperature: Number(
          data.current?.temperature_2m ?? 0
        ),

        humidity: Number(
          data.current
            ?.relative_humidity_2m ?? 0
        ),

        windSpeed: Number(
          data.current?.wind_speed_10m ?? 0
        ),

        weatherCode: Number(
          data.current?.weather_code ?? 0
        ),

        sunrise:
          data.daily?.sunrise?.[0] ?? "",

        sunset:
          data.daily?.sunset?.[0] ?? "",
      });
    } catch (error) {
      console.error(
        "Weather loading error:",
        error
      );
    } finally {
      setWeatherLoading(false);
    }
  }

  useEffect(() => {
    loadWeather();
  }, []);

  /*
   * ---------------------------------------------------------
   * GREETING
   * ---------------------------------------------------------
   */

  const greeting = useMemo(() => {
    if (!now) {
      return "Welcome";
    }

    const hour = now.getHours();

    if (hour < 12) {
      return "Good Morning";
    }

    if (hour < 17) {
      return "Good Afternoon";
    }

    return "Good Evening";
  }, [now]);

  /*
   * ---------------------------------------------------------
   * DATE
   * ---------------------------------------------------------
   */

  const today = useMemo(() => {
    if (!now) {
      return "Loading date...";
    }

    return now.toLocaleDateString(
      "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }, [now]);

  /*
   * ---------------------------------------------------------
   * CLOCK
   * ---------------------------------------------------------
   */

  const currentTime = useMemo(() => {
    if (!now) {
      return "--:--:--";
    }

    return now.toLocaleTimeString(
      "en-ZM",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }
    );
  }, [now]);

  /*
   * ---------------------------------------------------------
   * REFRESH
   * ---------------------------------------------------------
   */

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadWeather();
      setNow(new Date());
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  }

  return (
    <div className="sticky top-0 z-40 mb-8">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#03162F] via-[#06234A] to-[#0A2852] text-white shadow-2xl">

        {/* =================================================
            MAIN HEADER
        ================================================= */}

        <div className="p-5 sm:p-6 lg:p-7">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.9fr_0.9fr_1.6fr_0.95fr]">

            {/* PROFILE */}

            <div className="flex items-center gap-4 border-b border-white/10 pb-5 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-6">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4D77D] text-xl font-bold text-[#03162F] shadow-lg ring-4 ring-white/10">
                {profile?.display_name
                  ?.charAt(0)
                  ?.toUpperCase() ?? "A"}
              </div>

              <div className="min-w-0">
                <p className="text-sm text-slate-300">
                  {greeting},
                </p>

                <h1 className="truncate text-2xl font-bold sm:text-3xl">
                  {profile?.display_name ??
                    "Alessandro"}
                </h1>

                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

                  {profile?.role ??
                    "Enterprise Administrator"}
                </div>
              </div>
            </div>

            {/* LIVE TIME */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">

              <div className="flex items-center gap-2 text-sm font-semibold text-sky-300">
                <Activity className="h-4 w-4" />
                CURRENT TIME
              </div>

              <p className="mt-4 whitespace-nowrap text-2xl font-bold tracking-tight sm:text-3xl">
                {currentTime}

                <span className="ml-2 text-sm font-semibold text-sky-300">
                  CAT
                </span>
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {today}
              </p>
            </div>

            {/* WEATHER */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">

              <div className="flex items-center gap-2 text-sm font-semibold text-sky-300">
                {weather?.weatherCode === 0 ? (
                  <Sun className="h-4 w-4 text-yellow-300" />
                ) : (
                  <CloudSun className="h-4 w-4 text-sky-300" />
                )}

                WEATHER
              </div>

              {weatherLoading ? (
                <div className="mt-5 animate-pulse">
                  <div className="h-8 w-24 rounded bg-white/10" />
                  <div className="mt-3 h-3 w-28 rounded bg-white/10" />
                </div>
              ) : weather ? (
                <>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-3xl font-bold">
                      {Math.round(
                        weather.temperature
                      )}
                      °C
                    </span>

                    <Cloud className="h-8 w-8 text-sky-300" />
                  </div>

                  <p className="mt-1 text-sm text-slate-300">
                    {getWeatherDescription(
                      weather.weatherCode
                    )}
                  </p>

                  <div className="mt-3 flex gap-3 text-xs text-slate-400">
                    <span>
                      💧 {weather.humidity}%
                    </span>

                    <span>
                      💨{" "}
                      {Math.round(
                        weather.windSpeed
                      )}{" "}
                      km/h
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-5 text-sm text-slate-400">
                  Weather unavailable
                </p>
              )}
            </div>

            {/* BUSINESS FORECAST */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">

              <div className="flex items-center gap-2 text-sm font-semibold text-purple-300">
                <Activity className="h-4 w-4" />
                BUSINESS FORECAST
              </div>

              <div className="mt-4 grid grid-cols-3 divide-x divide-white/10">

                <div className="pr-3">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Bookings
                  </div>

                  <p className="mt-2 text-xl font-bold">
                    {forecast.bookings}
                  </p>

                  <p className="mt-1 text-xs text-emerald-400">
                    Today
                  </p>
                </div>

                <div className="px-3">
                  <p className="text-xs text-slate-400">
                    Revenue
                  </p>

                  <p className="mt-2 whitespace-nowrap text-base font-bold">
                    {formatMoney(
                      forecast.revenue
                    )}
                  </p>

                  <p className="mt-1 text-xs text-emerald-400">
                    Today
                  </p>
                </div>

                <div className="pl-3">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="h-3.5 w-3.5" />
                    Customers
                  </div>

                  <p className="mt-2 text-xl font-bold">
                    {forecast.newCustomers}
                  </p>

                  <p className="mt-1 text-xs text-emerald-400">
                    New today
                  </p>
                </div>

              </div>
            </div>

            {/* DATE / ACTIONS */}

            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left xl:text-right">

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Today
                </p>

                <p className="mt-2 text-base font-semibold leading-6">
                  {today}
                </p>
              </div>

              <div className="mt-4 flex gap-2 xl:justify-end">

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold transition hover:bg-blue-500 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  Refresh
                </button>

                <a
                  href="/dashboard/reports"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                >
                  <FileText className="h-4 w-4" />
                  Report
                </a>

              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 xl:justify-end">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                All systems operational
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM INFORMATION BAR */}

        <div className="flex flex-col gap-3 border-t border-white/10 bg-black/10 px-5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-7">

          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-base">💡</span>

            <span>
              <span className="font-semibold text-sky-300">
                Daily Focus:
              </span>{" "}
              Keep today's bookings moving and
              deliver an excellent customer
              experience.
            </span>
          </div>

          {weather && (
            <div className="flex items-center gap-4 text-slate-400">

              <span className="inline-flex items-center gap-1.5">
                <Sunset className="h-4 w-4 text-yellow-300" />

                Sunset{" "}

                <strong className="text-slate-200">
                  {formatTime(
                    weather.sunset
                  )}
                </strong>
              </span>

              <span className="hidden h-4 w-px bg-white/10 sm:block" />

              <span className="inline-flex items-center gap-1.5">
                <Sunrise className="h-4 w-4 text-purple-300" />

                Sunrise{" "}

                <strong className="text-slate-200">
                  {formatTime(
                    weather.sunrise
                  )}
                </strong>
              </span>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}