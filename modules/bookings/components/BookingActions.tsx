"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  Check,
  ChevronDown,
  CircleX,
  Clock,
  Edit3,
  Eye,
  Trash2,
  X,
} from "lucide-react";

import type { Booking } from "@/modules/bookings/services/booking.service";

interface BookingActionsProps {
  booking: Booking;

  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onConfirm: (booking: Booking) => void;
  onComplete: (booking: Booking) => void;
  onReject: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

export default function BookingActions({
  booking,
  onView,
  onEdit,
  onConfirm,
  onComplete,
  onReject,
  onCancel,
  onDelete,
}: BookingActionsProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] =
    useState<MenuPosition | null>(null);

  const buttonRef =
    useRef<HTMLButtonElement>(null);

  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * ---------------------------------------------------------
   * POSITION MENU
   * ---------------------------------------------------------
   */

  const updatePosition = () => {
    const button = buttonRef.current;

    if (!button) return;

    const rect =
      button.getBoundingClientRect();

    const menuWidth = 240;
    const menuHeight = 390;
    const gap = 8;
    const padding = 12;

    let left = rect.right - menuWidth;

    /*
     * Prevent menu from going outside the
     * left side of the screen.
     */

    if (left < padding) {
      left = padding;
    }

    /*
     * Prevent menu from going outside the
     * right side of the screen.
     */

    if (
      left + menuWidth >
      window.innerWidth - padding
    ) {
      left =
        window.innerWidth -
        menuWidth -
        padding;
    }

    /*
     * Normally open below the button.
     */

    let top = rect.bottom + gap;

    /*
     * If there isn't enough room below,
     * open above the button.
     */

    if (
      top + menuHeight >
      window.innerHeight - padding
    ) {
      top =
        rect.top -
        menuHeight -
        gap;
    }

    /*
     * Final safety check.
     */

    if (top < padding) {
      top = padding;
    }

    setPosition({
      top,
      left,
      width: menuWidth,
    });
  };

  /*
   * ---------------------------------------------------------
   * OPEN MENU
   * ---------------------------------------------------------
   */

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();

    const handleResize = () => {
      updatePosition();
    };

    const handleScroll = () => {
      updatePosition();
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    window.addEventListener(
      "scroll",
      handleScroll,
      true
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );
    };
  }, [open]);

  /*
   * ---------------------------------------------------------
   * CLOSE WHEN CLICKING OUTSIDE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        buttonRef.current?.contains(
          target
        )
      ) {
        return;
      }

      if (
        menuRef.current?.contains(
          target
        )
      ) {
        return;
      }

      setOpen(false);
    }

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);

  /*
   * ---------------------------------------------------------
   * ACTION HANDLER
   * ---------------------------------------------------------
   */

  function runAction(
    action: (booking: Booking) => void
  ) {
    setOpen(false);
    action(booking);
  }

  /*
   * ---------------------------------------------------------
   * BUTTON
   * ---------------------------------------------------------
   */

  const button = (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => {
        setOpen((current) => !current);
      }}
      className={`
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        px-4
        py-2.5
        text-sm
        font-semibold
        shadow-sm
        transition
        ${
          open
            ? "border-[#D4AF37] bg-[#03162F] text-white"
            : "border-slate-300 bg-white text-[#03162F] hover:border-[#D4AF37] hover:bg-slate-50"
        }
      `}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      Actions

      <ChevronDown
        className={`
          h-4
          w-4
          transition-transform
          ${open ? "rotate-180" : ""}
        `}
      />
    </button>
  );

  /*
   * ---------------------------------------------------------
   * MENU
   * ---------------------------------------------------------
   */

  const menu =
    open &&
    mounted &&
    position &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        className="
          fixed
          z-[9999]
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
          ring-1
          ring-black/5
        "
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
      >
        {/* View */}
        <button
          type="button"
          role="menuitem"
          onClick={() =>
            runAction(onView)
          }
          className="
            flex
            w-full
            items-center
            gap-3
            px-4
            py-3
            text-left
            text-sm
            font-medium
            text-slate-700
            transition
            hover:bg-slate-50
            hover:text-[#03162F]
          "
        >
          <Eye className="h-4 w-4" />
          View Booking
        </button>

        {/* Edit */}
        <button
          type="button"
          role="menuitem"
          onClick={() =>
            runAction(onEdit)
          }
          className="
            flex
            w-full
            items-center
            gap-3
            px-4
            py-3
            text-left
            text-sm
            font-medium
            text-slate-700
            transition
            hover:bg-slate-50
            hover:text-[#03162F]
          "
        >
          <Edit3 className="h-4 w-4" />
          Edit Booking
        </button>

        <div className="my-1 border-t border-slate-100" />

        {/* Confirm */}
        {booking.status === "Pending" && (
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              runAction(onConfirm)
            }
            className="
              flex
              w-full
              items-center
              gap-3
              px-4
              py-3
              text-left
              text-sm
              font-medium
              text-green-700
              transition
              hover:bg-green-50
            "
          >
            <Check className="h-4 w-4" />
            Confirm Booking
          </button>
        )}

        {/* Complete */}
        {booking.status === "Confirmed" && (
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              runAction(onComplete)
            }
            className="
              flex
              w-full
              items-center
              gap-3
              px-4
              py-3
              text-left
              text-sm
              font-medium
              text-blue-700
              transition
              hover:bg-blue-50
            "
          >
            <Check className="h-4 w-4" />
            Mark as Complete
          </button>
        )}

        {/* Reject */}
        {booking.status === "Pending" && (
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              runAction(onReject)
            }
            className="
              flex
              w-full
              items-center
              gap-3
              px-4
              py-3
              text-left
              text-sm
              font-medium
              text-orange-700
              transition
              hover:bg-orange-50
            "
          >
            <CircleX className="h-4 w-4" />
            Reject Booking
          </button>
        )}

        {/* Cancel */}
        {(
          booking.status === "Pending" ||
          booking.status === "Confirmed"
        ) && (
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              runAction(onCancel)
            }
            className="
              flex
              w-full
              items-center
              gap-3
              px-4
              py-3
              text-left
              text-sm
              font-medium
              text-red-600
              transition
              hover:bg-red-50
            "
          >
            <X className="h-4 w-4" />
            Cancel Booking
          </button>
        )}

        <div className="my-1 border-t border-slate-100" />

        {/* Delete */}
        <button
          type="button"
          role="menuitem"
          onClick={() =>
            runAction(onDelete)
          }
          className="
            flex
            w-full
            items-center
            gap-3
            px-4
            py-3
            text-left
            text-sm
            font-semibold
            text-red-700
            transition
            hover:bg-red-50
          "
        >
          <Trash2 className="h-4 w-4" />
          Delete Booking
        </button>
      </div>,
      document.body
    );

  return (
    <>
      {button}
      {menu}
    </>
  );
}