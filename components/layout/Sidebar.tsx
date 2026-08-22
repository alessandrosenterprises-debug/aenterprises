"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  navigation,
  type NavigationItem,
} from "@/lib/navigation";

/* ============================================================
   SIDEBAR ITEM
============================================================ */

function SidebarItem({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const hasChildren = !!item.children?.length;

  const activeChild =
    item.children?.some(
      (child) =>
        child.href &&
        (pathname === child.href ||
          pathname.startsWith(`${child.href}/`))
    ) ?? false;

  const [open, setOpen] = useState(Boolean(activeChild));

  /* ==========================================================
     PARENT WITH CHILDREN
  ========================================================== */

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`
            flex
            w-full
            items-center
            justify-between
            rounded-xl
            px-4
            py-3
            transition
            duration-200
            ${
              activeChild
                ? "bg-[#03162F] text-white shadow-lg"
                : "text-[#03162F] hover:bg-[#D4AF37]/20"
            }
          `}
        >
          <span className="flex min-w-0 flex-1 items-center gap-4">
            {item.icon && (
              <item.icon
                className={`
                  h-5
                  w-5
                  shrink-0
                  ${
                    activeChild
                      ? "text-[#D4AF37]"
                      : "text-[#03162F]"
                  }
                `}
              />
            )}

            <span
              className="
                whitespace-nowrap
                font-semibold
                uppercase
                tracking-[0.045em]
              "
            >
              {item.title}
            </span>
          </span>

          <ChevronDown
            className={`
              ml-3
              h-4
              w-4
              shrink-0
              transition-transform
              ${
                open
                  ? "rotate-180"
                  : ""
              }
            `}
          />
        </button>

        {open && (
          <div
            className="
              ml-5
              space-y-1
              border-l
              border-[#03162F]/20
              pl-3
            "
          >
            {item.children!.map((child) => {
              if (!child.href) {
                return null;
              }

              const active =
                pathname === child.href ||
                pathname.startsWith(`${child.href}/`);

              return (
                <Link
                  key={child.title}
                  href={child.href}
                  className={`
                    block
                    whitespace-nowrap
                    rounded-lg
                    px-4
                    py-2.5
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.035em]
                    transition
                    ${
                      active
                        ? "bg-[#03162F] text-white shadow-md"
                        : "text-[#03162F]/80 hover:bg-[#D4AF37]/20 hover:text-[#03162F]"
                    }
                  `}
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

  /* ==========================================================
     NORMAL ITEM
  ========================================================== */

  const active =
    !!item.href &&
    (pathname === item.href ||
      pathname.startsWith(`${item.href}/`));

  return (
    <Link
      href={item.href ?? "#"}
      className={`
        group
        flex
        items-center
        gap-4
        rounded-xl
        px-4
        py-3
        transition
        duration-200
        ${
          active
            ? "bg-[#03162F] text-white shadow-lg"
            : "text-[#03162F] hover:bg-[#D4AF37]/20"
        }
      `}
    >
      {item.icon && (
        <item.icon
          className={`
            h-5
            w-5
            shrink-0
            transition
            ${
              active
                ? "text-[#D4AF37]"
                : "text-[#03162F]"
            }
          `}
        />
      )}

      <span
        className="
          whitespace-nowrap
          font-semibold
          uppercase
          tracking-[0.045em]
        "
      >
        {item.title}
      </span>
    </Link>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        sticky
        top-0
        z-40
        flex
        h-full
        w-[280px]
        min-w-[280px]
        shrink-0
        flex-col
        overflow-hidden
        border-r
        border-[#8F6500]/50
        bg-[#B8860B]
        text-[#03162F]
        shadow-[4px_0_18px_rgba(3,22,47,0.12)]
      "
    >
      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          px-4
          py-5
        "
      >
        {/* SECTION LABEL */}

        <div className="mb-4 px-2">
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-[#03162F]/60
            "
          >
            Main Navigation
          </p>
        </div>

        {/* NAVIGATION ITEMS */}

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

      {/* =====================================================
          BOTTOM BRAND STRIP
      ===================================================== */}

      <div
        className="
          shrink-0
          border-t
          border-[#8F6500]/40
          bg-[#8F6500]/15
          px-5
          py-4
        "
      >
        <p
          className="
            whitespace-nowrap
            text-[10px]
            font-bold
            uppercase
            tracking-[0.14em]
            text-[#03162F]/75
          "
        >
          Alessandro Enterprises
        </p>

        <p
          className="
            mt-1
            whitespace-nowrap
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.08em]
            text-[#03162F]/55
          "
        >
          Management Platform
        </p>
      </div>
    </aside>
  );
}