"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Search,
  Users,
  X,
} from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
}

interface SearchResult {
  title: string;
  description: string;
  href: string;
  icon: typeof Users;
}

const searchResults: SearchResult[] = [
  {
    title: "Customers",
    description: "Manage customer records",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Employees",
    description: "Manage employees and staff",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    title: "Bookings",
    description: "View customer bookings",
    href: "/dashboard/bookings",
    icon: CalendarDays,
  },
];

export default function SearchInput({
  placeholder = "Search the enterprise...",
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim().toLowerCase();

  const filteredResults =
    trimmedQuery.length === 0
      ? searchResults
      : searchResults.filter((result) =>
          `${result.title} ${result.description}`
            .toLowerCase()
            .includes(trimmedQuery)
        );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setFocused(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Escape") {
      setQuery("");
      setFocused(false);
    }

    if (event.key === "Enter" && query.trim()) {
      setFocused(true);
    }
  }

  function clearSearch() {
    setQuery("");
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-xl"
    >
      {/* SEARCH INPUT */}

      <div
        className={`relative flex h-12 items-center rounded-2xl border bg-white transition-all duration-200 ${
          focused
            ? "border-[#D4AF37] shadow-[0_0_0_4px_rgba(212,175,55,0.12)]"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <Search
          className={`absolute left-4 h-5 w-5 transition ${
            focused
              ? "text-[#D4AF37]"
              : "text-slate-400"
          }`}
        />

        <input
          type="text"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-full w-full rounded-2xl bg-transparent pl-12 pr-12 text-sm font-medium text-[#03162F] outline-none placeholder:text-slate-400"
          aria-label="Search enterprise"
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* SEARCH DROPDOWN */}

      {focused && (
        <div className="absolute left-0 right-0 top-14 z-[300] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {trimmedQuery
                ? "Search Results"
                : "Quick Access"}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => {
                const Icon = result.icon;

                return (
                  <a
                    key={result.title}
                    href={result.href}
                    onClick={() =>
                      setFocused(false)
                    }
                    className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white transition group-hover:bg-[#0A2852]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#03162F]">
                        {result.title}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {result.description}
                      </p>
                    </div>
                  </a>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 font-semibold text-[#03162F]">
                  No results found
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Try another search term.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <p className="text-xs text-slate-400">
              Press{" "}
              <span className="rounded bg-white px-1.5 py-0.5 font-semibold text-slate-600 shadow-sm">
                ESC
              </span>{" "}
              to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}