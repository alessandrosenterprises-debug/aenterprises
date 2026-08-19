"use client";

import { useEffect, useRef, useState } from "react";

import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  UserCircle,
} from "lucide-react";

export default function UserProfile() {
  const [open, setOpen] = useState(false);

  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
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

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* PROFILE BUTTON */}

      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className={`flex items-center gap-3 rounded-2xl p-2 transition ${
          open
            ? "bg-slate-100"
            : "hover:bg-slate-100"
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* AVATAR */}

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#03162F] text-white shadow-sm">
          <User size={20} />
        </div>

        {/* NAME */}

        <div className="hidden text-left lg:block">
          <p className="font-semibold text-[#03162F]">
            Alessandro
          </p>

          <p className="text-xs text-slate-500">
            Super Administrator
          </p>
        </div>

        <ChevronDown
          className={`hidden h-4 w-4 text-slate-500 transition-transform lg:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* PROFILE DROPDOWN */}

      {open && (
        <div className="absolute right-0 top-14 z-[300] w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

          {/* PROFILE HEADER */}

          <div className="border-b border-slate-100 bg-gradient-to-br from-[#03162F] to-[#0A2852] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] font-bold text-[#03162F]">
                A
              </div>

              <div className="min-w-0">
                <p className="truncate font-bold">
                  Alessandro
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-300">
                  Super Administrator
                </p>

                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* MENU */}

          <div className="p-2">

            <a
              href="/dashboard/enterprise"
              onClick={closeMenu}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-[#03162F] group-hover:text-white">
                <UserCircle className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-[#03162F]">
                  My Profile
                </p>

                <p className="text-xs text-slate-500">
                  View your account profile
                </p>
              </div>
            </a>

            <a
              href="/dashboard/settings"
              onClick={closeMenu}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-[#03162F] group-hover:text-white">
                <Settings className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-[#03162F]">
                  Account Settings
                </p>

                <p className="text-xs text-slate-500">
                  Manage your preferences
                </p>
              </div>
            </a>

            <a
              href="/dashboard/notifications"
              onClick={closeMenu}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-[#03162F] group-hover:text-white">
                <Bell className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-[#03162F]">
                  Notifications
                </p>

                <p className="text-xs text-slate-500">
                  View your latest alerts
                </p>
              </div>

              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                2
              </span>
            </a>
          </div>

          {/* SIGN OUT */}

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={() => {
                closeMenu();

                /*
                 * We will connect this to Supabase
                 * signOut next.
                 */
                window.location.href =
                  "/login";
              }}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-red-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition group-hover:bg-red-100">
                <LogOut className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-600">
                  Sign Out
                </p>

                <p className="text-xs text-slate-500">
                  End your current session
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}