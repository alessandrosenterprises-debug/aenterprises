"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  navigation,
  type NavigationItem,
} from "@/lib/navigation";

function SidebarItem({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const hasChildren =
    !!item.children?.length;

  const activeChild =
    item.children?.some(
      (child) =>
        child.href &&
        (pathname === child.href ||
          pathname.startsWith(
            `${child.href}/`
          ))
    ) ?? false;

  const [open, setOpen] = useState(
    Boolean(activeChild)
  );

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() =>
            setOpen((value) => !value)
          }
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition ${
            activeChild
              ? "bg-[#0A2852] text-white"
              : "text-slate-300 hover:bg-[#0A2852]/70 hover:text-white"
          }`}
        >
          <span className="flex min-w-0 items-center gap-4">
            {item.icon && (
              <item.icon className="h-5 w-5 shrink-0" />
            )}

            <span className="truncate font-medium">
              {item.title}
            </span>
          </span>

          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="ml-5 space-y-1 border-l border-white/10 pl-3">
            {item.children!.map((child) => {
              if (!child.href) {
                return null;
              }

              const active =
                pathname === child.href ||
                pathname.startsWith(
                  `${child.href}/`
                );

              return (
                <Link
                  key={child.title}
                  href={child.href}
                  className={`block rounded-lg px-4 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#D4AF37] font-semibold text-[#03162F]"
                      : "text-slate-300 hover:bg-[#0A2852] hover:text-white"
                  }`}
                >
                  {child.title}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const active =
    !!item.href &&
    (pathname === item.href ||
      pathname.startsWith(
        `${item.href}/`
      ));

  return (
    <Link
      href={item.href ?? "#"}
      className={`flex items-center gap-4 rounded-xl px-4 py-3 transition ${
        active
          ? "border-l-4 border-[#D4AF37] bg-[#0A2852] text-white shadow-lg"
          : "text-slate-300 hover:bg-[#0A2852]/70 hover:text-white"
      }`}
    >
      {item.icon && (
        <item.icon className="h-5 w-5 shrink-0" />
      )}

      <span className="truncate font-medium">
        {item.title}
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        sticky
        top-0
        z-40
        flex
        h-screen
        w-[280px]
        min-w-[280px]
        shrink-0
        flex-col
        overflow-hidden
        bg-[#03162F]
        text-white
        shadow-xl
      "
    >
      {/* BRAND */}
      <div className="shrink-0 border-b border-white/10 bg-[#03162F] p-6">
        <h1 className="text-2xl font-bold tracking-wide text-[#D4AF37]">
          ALESSANDRO
        </h1>

        <p className="mt-1 text-sm text-slate-300">
          Enterprise Platform
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {navigation.map((item) => (
            <SidebarItem
              key={item.title}
              item={item}
              pathname={pathname}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}