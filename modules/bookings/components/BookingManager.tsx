"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleX,
  Clock,
  Edit3,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  createBooking,
  deleteBooking,
  updateBooking,
  type BookingPayload,
} from "@/modules/bookings/services/booking.client";

import type {
  Booking,
  BookingFormData,
} from "@/modules/bookings/services/booking.service";

interface BookingManagerProps {
  bookings: Booking[];
  formData: BookingFormData;
}

type ModalMode =
  | "create"
  | "view"
  | "edit"
  | null;

type ActionType =
  | "confirm"
  | "complete"
  | "reject"
  | "cancel"
  | "delete"
  | null;

interface MenuPosition {
  top: number;
  left: number;
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const statusClass: Record<
  Booking["status"],
  string
> = {
  Pending:
    "bg-yellow-100 text-yellow-700",
  Confirmed:
    "bg-blue-100 text-blue-700",
  Completed:
    "bg-green-100 text-green-700",
  Cancelled:
    "bg-red-100 text-red-700",
};

const paymentClass: Record<
  Booking["payment_status"],
  string
> = {
  Pending:
    "bg-yellow-100 text-yellow-700",
  Partial:
    "bg-blue-100 text-blue-700",
  Paid:
    "bg-green-100 text-green-700",
  Refunded:
    "bg-red-100 text-red-700",
};

function formatDate(date: string) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount: number) {
  return `ZMW ${amount.toFixed(2)}`;
}

function formatTime(time: string | null) {
  if (!time) return "";

  return time.slice(0, 5);
}

function getActionLabel(
  action: ActionType
) {
  switch (action) {
    case "confirm":
      return "Confirm Booking";

    case "complete":
      return "Mark Booking as Complete";

    case "reject":
      return "Reject Booking";

    case "cancel":
      return "Cancel Booking";

    case "delete":
      return "Delete Booking";

    default:
      return "";
  }
}

function getActionDescription(
  action: ActionType
) {
  switch (action) {
    case "confirm":
      return "This will confirm the booking and make it ready for the scheduled appointment.";

    case "complete":
      return "This will mark the booking as completed.";

    case "reject":
      return "This will reject the pending booking and mark it as cancelled.";

    case "cancel":
      return "This will cancel the booking.";

    case "delete":
      return "This permanently removes the booking record. This action cannot be undone.";

    default:
      return "";
  }
}

export default function BookingManager({
  bookings,
  formData,
}: BookingManagerProps) {
  const router = useRouter();

  /*
   * ---------------------------------------------------------
   * CREATE / EDIT MODAL
   * ---------------------------------------------------------
   */

  const [modalMode, setModalMode] =
    useState<ModalMode>(null);

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  /*
   * ---------------------------------------------------------
   * ACTION CONFIRMATION
   * ---------------------------------------------------------
   */

  const [action, setAction] =
    useState<ActionType>(null);

  const [actionBooking, setActionBooking] =
    useState<Booking | null>(null);

  const [processing, setProcessing] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * FORM
   * ---------------------------------------------------------
   */

  const [businessId, setBusinessId] =
    useState("");

  const [customerId, setCustomerId] =
    useState("");

  const [employeeId, setEmployeeId] =
    useState("");

  const [branchId, setBranchId] =
    useState("");

  const [catalogItemId, setCatalogItemId] =
    useState("");

  const [bookingDate, setBookingDate] =
    useState("");

  const [bookingTime, setBookingTime] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [status, setStatus] =
    useState<BookingPayload["status"]>(
      "Pending"
    );

  const [paymentStatus, setPaymentStatus] =
    useState<
      BookingPayload["payment_status"]
    >("Pending");

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * ---------------------------------------------------------
   * ACTION MENU
   * ---------------------------------------------------------
   */

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [menuPosition, setMenuPosition] =
    useState<MenuPosition | null>(null);

  const menuButtonRefs =
    useRef<
      Record<
        string,
        HTMLButtonElement | null
      >
    >({});

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * ---------------------------------------------------------
   * FILTER FORM DATA BY BUSINESS
   * ---------------------------------------------------------
   */

  const customers = useMemo(
    () =>
      formData.customers.filter(
        (customer) =>
          !businessId ||
          customer.business_id ===
            businessId
      ),
    [formData.customers, businessId]
  );

  const employees = useMemo(
    () =>
      formData.employees.filter(
        (employee) =>
          !businessId ||
          employee.business_id ===
            businessId
      ),
    [formData.employees, businessId]
  );

  const branches = useMemo(
    () =>
      formData.branches.filter(
        (branch) =>
          !businessId ||
          branch.business_id ===
            businessId
      ),
    [formData.branches, businessId]
  );

  const catalogItems = useMemo(
    () =>
      formData.catalogItems.filter(
        (item) =>
          !businessId ||
          item.business_id ===
            businessId
      ),
    [formData.catalogItems, businessId]
  );

  /*
   * ---------------------------------------------------------
   * RESET FORM
   * ---------------------------------------------------------
   */

  function resetForm() {
    setBusinessId("");
    setCustomerId("");
    setEmployeeId("");
    setBranchId("");
    setCatalogItemId("");
    setBookingDate("");
    setBookingTime("");
    setAmount("");
    setStatus("Pending");
    setPaymentStatus("Pending");
    setNotes("");
    setError("");
  }

  /*
   * ---------------------------------------------------------
   * LOAD BOOKING INTO FORM
   * ---------------------------------------------------------
   */

  function loadBookingIntoForm(
    booking: Booking
  ) {
    setBusinessId(
      booking.business_id ?? ""
    );

    setCustomerId(
      booking.customer_id ?? ""
    );

    setEmployeeId(
      booking.employee_id ?? ""
    );

    setBranchId(
      booking.branch_id ?? ""
    );

    setCatalogItemId(
      booking.catalog_item_id ?? ""
    );

    setBookingDate(
      booking.booking_date ?? ""
    );

    setBookingTime(
      booking.booking_time
        ? booking.booking_time.slice(
            0,
            5
          )
        : ""
    );

    setAmount(
      Number(
        booking.amount ?? 0
      ).toFixed(2)
    );

    setStatus(booking.status);

    setPaymentStatus(
      booking.payment_status
    );

    setNotes(
      booking.notes ?? ""
    );

    setError("");
  }

  /*
   * ---------------------------------------------------------
   * OPEN CREATE
   * ---------------------------------------------------------
   */

  function openCreate() {
    setSelectedBooking(null);
    resetForm();
    setModalMode("create");
  }

  /*
   * ---------------------------------------------------------
   * OPEN VIEW
   * ---------------------------------------------------------
   */

  function openView(
    booking: Booking
  ) {
    setSelectedBooking(booking);
    setModalMode("view");
    setOpenMenuId(null);
  }

  /*
   * ---------------------------------------------------------
   * OPEN EDIT
   * ---------------------------------------------------------
   */

  function openEdit(
    booking: Booking
  ) {
    setSelectedBooking(booking);
    loadBookingIntoForm(booking);
    setModalMode("edit");
    setOpenMenuId(null);
  }

  /*
   * ---------------------------------------------------------
   * CLOSE MODAL
   * ---------------------------------------------------------
   */

  function closeModal() {
    if (saving) return;

    setModalMode(null);
    setSelectedBooking(null);
    resetForm();
  }

  /*
   * ---------------------------------------------------------
   * BUSINESS CHANGE
   * ---------------------------------------------------------
   */

  function handleBusinessChange(
    value: string
  ) {
    setBusinessId(value);
    setCustomerId("");
    setEmployeeId("");
    setBranchId("");
    setCatalogItemId("");
    setAmount("");
  }

  /*
   * ---------------------------------------------------------
   * CATALOG CHANGE
   * ---------------------------------------------------------
   */

  function handleCatalogChange(
    value: string
  ) {
    setCatalogItemId(value);

    const item =
      formData.catalogItems.find(
        (catalogItem) =>
          catalogItem.id === value
      );

    if (item) {
      setAmount(
        Number(
          item.base_price ?? 0
        ).toFixed(2)
      );
    } else {
      setAmount("");
    }
  }

  /*
   * ---------------------------------------------------------
   * SAVE BOOKING
   * ---------------------------------------------------------
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!businessId) {
      setError(
        "Please select a business."
      );
      return;
    }

    if (!bookingDate) {
      setError(
        "Please select a booking date."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: BookingPayload = {
        business_id: businessId,
        customer_id:
          customerId || null,
        employee_id:
          employeeId || null,
        branch_id:
          branchId || null,
        catalog_item_id:
          catalogItemId || null,
        booking_date:
          bookingDate,
        booking_time:
          bookingTime || null,
        status,
        payment_status:
          paymentStatus,
        amount: Number(
          amount || 0
        ),
        notes:
          notes.trim() || null,
      };

      if (
        modalMode === "edit" &&
        selectedBooking
      ) {
        await updateBooking(
          selectedBooking.id,
          payload
        );
      } else {
        await createBooking(
          payload
        );
      }

      closeModal();

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save booking."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * OPEN ACTION CONFIRMATION
   * ---------------------------------------------------------
   */

  function openAction(
    booking: Booking,
    nextAction: ActionType
  ) {
    setOpenMenuId(null);
    setActionBooking(booking);
    setAction(nextAction);
  }

  /*
   * ---------------------------------------------------------
   * CLOSE ACTION CONFIRMATION
   * ---------------------------------------------------------
   */

  function closeAction() {
    if (processing) return;

    setAction(null);
    setActionBooking(null);
  }

  /*
   * ---------------------------------------------------------
   * EXECUTE ACTION
   * ---------------------------------------------------------
   */

  async function executeAction() {
    if (
      !action ||
      !actionBooking
    ) {
      return;
    }

    setProcessing(true);

    try {
      switch (action) {
        case "confirm":
          await updateBooking(
            actionBooking.id,
            {
              status:
                "Confirmed",
            }
          );
          break;

        case "complete":
          await updateBooking(
            actionBooking.id,
            {
              status:
                "Completed",
            }
          );
          break;

        case "reject":
          await updateBooking(
            actionBooking.id,
            {
              status:
                "Cancelled",
            }
          );
          break;

        case "cancel":
          await updateBooking(
            actionBooking.id,
            {
              status:
                "Cancelled",
            }
          );
          break;

        case "delete":
          await deleteBooking(
            actionBooking.id
          );
          break;
      }

      closeAction();

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete booking action."
      );

      closeAction();
    } finally {
      setProcessing(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * MENU POSITION
   * ---------------------------------------------------------
   */

  function updateMenuPosition(
    bookingId: string
  ) {
    const button =
      menuButtonRefs.current[
        bookingId
      ];

    if (!button) return;

    const rect =
      button.getBoundingClientRect();

    const menuWidth = 250;
    const menuHeight = 430;
    const gap = 8;
    const padding = 12;

    let left =
      rect.right - menuWidth;

    if (left < padding) {
      left = padding;
    }

    if (
      left + menuWidth >
      window.innerWidth - padding
    ) {
      left =
        window.innerWidth -
        menuWidth -
        padding;
    }

    let top =
      rect.bottom + gap;

    if (
      top + menuHeight >
      window.innerHeight - padding
    ) {
      top =
        rect.top -
        menuHeight -
        gap;
    }

    if (top < padding) {
      top = padding;
    }

    setMenuPosition({
      top,
      left,
    });
  }

  /*
   * ---------------------------------------------------------
   * MENU EFFECTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!openMenuId) return;

    updateMenuPosition(
      openMenuId
    );

    function handleResize() {
      if (openMenuId) {
        updateMenuPosition(
          openMenuId
        );
      }
    }

    function handleScroll() {
      if (openMenuId) {
        updateMenuPosition(
          openMenuId
        );
      }
    }

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
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) return;

    function handleOutsideClick(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        menuRef.current?.contains(
          target
        )
      ) {
        return;
      }

      const button =
  openMenuId
    ? menuButtonRefs.current[openMenuId]
    : null;
      if (
        button?.contains(target)
      ) {
        return;
      }

      setOpenMenuId(null);
      setMenuPosition(null);
    }

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [openMenuId]);

  /*
   * ---------------------------------------------------------
   * TOGGLE MENU
   * ---------------------------------------------------------
   */

  function toggleMenu(
    bookingId: string
  ) {
    if (
      openMenuId === bookingId
    ) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }

    setOpenMenuId(bookingId);

    requestAnimationFrame(() => {
      updateMenuPosition(
        bookingId
      );
    });
  }

  /*
   * ---------------------------------------------------------
   * RENDER ACTION MENU
   * ---------------------------------------------------------
   */

  function renderActionMenu(
    booking: Booking
  ) {
    if (
      !mounted ||
      openMenuId !== booking.id ||
      !menuPosition
    ) {
      return null;
    }

    return createPortal(
      <div
        ref={menuRef}
        className="
          fixed
          z-[9999]
          w-[250px]
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
          top: menuPosition.top,
          left: menuPosition.left,
        }}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Booking Actions
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-[#03162F]">
            {booking.customers
              ?.full_name ??
              "Walk-in / Unknown"}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            openView(booking)
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
          "
        >
          <Eye className="h-4 w-4" />
          View Booking
        </button>

        <button
          type="button"
          onClick={() =>
            openEdit(booking)
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
          "
        >
          <Edit3 className="h-4 w-4" />
          Edit Booking
        </button>

        <div className="border-t border-slate-100" />

        {booking.status ===
          "Pending" && (
          <>
            <button
              type="button"
              onClick={() =>
                openAction(
                  booking,
                  "confirm"
                )
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

            <button
              type="button"
              onClick={() =>
                openAction(
                  booking,
                  "reject"
                )
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
          </>
        )}

        {booking.status ===
          "Confirmed" && (
          <button
            type="button"
            onClick={() =>
              openAction(
                booking,
                "complete"
              )
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
            <CheckCircle2 className="h-4 w-4" />
            Mark as Complete
          </button>
        )}

        {(
          booking.status ===
            "Pending" ||
          booking.status ===
            "Confirmed"
        ) && (
          <button
            type="button"
            onClick={() =>
              openAction(
                booking,
                "cancel"
              )
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

        <div className="border-t border-slate-100" />

        <button
          type="button"
          onClick={() =>
            openAction(
              booking,
              "delete"
            )
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
  }

  /*
   * ---------------------------------------------------------
   * CREATE / EDIT FORM
   * ---------------------------------------------------------
   */

  function renderFormModal() {
    if (!modalMode) {
      return null;
    }

    const isEditing =
      modalMode === "edit";

    return (
      <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#03162F]/60 p-4 backdrop-blur-sm">
        <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-[#03162F]">
                {isEditing
                  ? "Edit Booking"
                  : "New Booking"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? "Update the booking information below."
                  : "Create a new customer booking or appointment."}
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Business *
                </span>

                <select
                  value={businessId}
                  onChange={(event) =>
                    handleBusinessChange(
                      event.target.value
                    )
                  }
                  className={inputClass}
                  required
                >
                  <option value="">
                    Select business
                  </option>

                  {formData.businesses.map(
                    (business) => (
                      <option
                        key={business.id}
                        value={business.id}
                      >
                        {business.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Customer
                </span>

                <select
                  value={customerId}
                  onChange={(event) =>
                    setCustomerId(
                      event.target.value
                    )
                  }
                  className={inputClass}
                  disabled={!businessId}
                >
                  <option value="">
                    No customer assigned
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.full_name}
                        {customer.phone
                          ? ` — ${customer.phone}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Service / Catalog Item
                </span>

                <select
                  value={catalogItemId}
                  onChange={(event) =>
                    handleCatalogChange(
                      event.target.value
                    )
                  }
                  className={inputClass}
                  disabled={!businessId}
                >
                  <option value="">
                    Select service or item
                  </option>

                  {catalogItems.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Employee
                </span>

                <select
                  value={employeeId}
                  onChange={(event) =>
                    setEmployeeId(
                      event.target.value
                    )
                  }
                  className={inputClass}
                  disabled={!businessId}
                >
                  <option value="">
                    Select employee
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.full_name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Branch
                </span>

                <select
                  value={branchId}
                  onChange={(event) =>
                    setBranchId(
                      event.target.value
                    )
                  }
                  className={inputClass}
                  disabled={!businessId}
                >
                  <option value="">
                    Select branch
                  </option>

                  {branches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Amount (ZMW)
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="0.00"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Booking Date *
                </span>

                <input
                  type="date"
                  value={bookingDate}
                  onChange={(event) =>
                    setBookingDate(
                      event.target.value
                    )
                  }
                  className={inputClass}
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Booking Time
                </span>

                <input
                  type="time"
                  value={bookingTime}
                  onChange={(event) =>
                    setBookingTime(
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Booking Status
                </span>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as BookingPayload["status"]
                    )
                  }
                  className={inputClass}
                >
                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Confirmed">
                    Confirmed
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Payment Status
                </span>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(
                      event.target
                        .value as BookingPayload["payment_status"]
                    )
                  }
                  className={inputClass}
                >
                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Partial">
                    Partial
                  </option>

                  <option value="Paid">
                    Paid
                  </option>

                  <option value="Refunded">
                    Refunded
                  </option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Notes
              </span>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                className={`${inputClass} min-h-[110px] resize-y`}
                placeholder="Optional booking notes..."
              />
            </label>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-6 py-3 font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * VIEW MODAL
   * ---------------------------------------------------------
   */

  function renderViewModal() {
    if (
      modalMode !== "view" ||
      !selectedBooking
    ) {
      return null;
    }

    const booking =
      selectedBooking;

    return (
      <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#03162F]/60 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-[#03162F]">
                Booking Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete information for this booking.
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Customer
                </p>

                <p className="mt-2 font-semibold text-[#03162F]">
                  {booking.customers
                    ?.full_name ??
                    "Walk-in / Unknown"}
                </p>

                {booking.customers?.phone && (
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.customers.phone}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Business
                </p>

                <p className="mt-2 font-semibold text-[#03162F]">
                  {booking.businesses
                    ?.name ?? "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Service / Item
                </p>

                <p className="mt-2 font-semibold text-[#03162F]">
                  {booking
                    .enterprise_catalog
                    ?.name ?? "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Employee
                </p>

                <p className="mt-2 font-semibold text-[#03162F]">
                  {booking.employees
                    ?.full_name ?? "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Branch
                </p>

                <p className="mt-2 font-semibold text-[#03162F]">
                  {booking.branches
                    ?.name ?? "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Amount
                </p>

                <p className="mt-2 font-semibold text-[#03162F]">
                  {formatMoney(
                    Number(
                      booking.amount ?? 0
                    )
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">
                  Date
                </p>

                <p className="mt-1 font-semibold text-[#03162F]">
                  {formatDate(
                    booking.booking_date
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Time
                </p>

                <p className="mt-1 font-semibold text-[#03162F]">
                  {formatTime(
                    booking.booking_time
                  ) || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Booking Status
                </p>

                <span
                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass[booking.status]}`}
                >
                  {booking.status}
                </span>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Payment Status
                </p>

                <span
                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentClass[booking.payment_status]}`}
                >
                  {booking.payment_status}
                </span>
              </div>
            </div>

            {booking.notes && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Notes
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {booking.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() =>
                  openEdit(booking)
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ACTION CONFIRMATION MODAL
   * ---------------------------------------------------------
   */

  function renderActionModal() {
    if (
      !action ||
      !actionBooking
    ) {
      return null;
    }

    const destructive =
      action === "delete" ||
      action === "reject" ||
      action === "cancel";

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#03162F]/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
          <div className="p-6">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                destructive
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {action ===
                "delete" ? (
                <Trash2 className="h-6 w-6" />
              ) : action ===
                "complete" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : action ===
                "confirm" ? (
                <Check className="h-6 w-6" />
              ) : (
                <CircleX className="h-6 w-6" />
              )}
            </div>

            <h2 className="mt-5 text-center text-xl font-bold text-[#03162F]">
              {getActionLabel(
                action
              )}
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-slate-500">
              {getActionDescription(
                action
              )}
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
              <p className="font-semibold text-[#03162F]">
                {actionBooking
                  .customers
                  ?.full_name ??
                  "Walk-in / Unknown"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {formatDate(
                  actionBooking.booking_date
                )}

                {actionBooking.booking_time
                  ? ` at ${formatTime(
                      actionBooking.booking_time
                    )}`
                  : ""}
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAction}
                disabled={processing}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                No, Go Back
              </button>

              <button
                type="button"
                onClick={executeAction}
                disabled={processing}
                className={`
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  px-5
                  py-3
                  font-semibold
                  text-white
                  transition
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  ${
                    destructive
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#03162F] hover:bg-[#0A2852]"
                  }
                `}
              >
                {processing && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {processing
                  ? "Processing..."
                  : "Yes, Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * MAIN RENDER
   * ---------------------------------------------------------
   */

  return (
    <>
      <div className="space-y-6">
        {/* Header / Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#03162F]">
              Booking Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create, review and manage customer bookings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                router.refresh()
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0A2852] hover:shadow-md"
            >
              <Plus className="h-5 w-5" />
              New Booking
            </button>
          </div>
        </div>

        {error &&
          !modalMode &&
          !action && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

        {/* Records */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-[#03162F]">
              Booking Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {bookings.length} booking
              {bookings.length === 1
                ? ""
                : "s"} found.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />

              <h3 className="mt-4 text-lg font-bold text-[#03162F]">
                No bookings yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Customer bookings will appear here once they are created.
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
              >
                <Plus className="h-4 w-4" />
                Create First Booking
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Business
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Service / Item
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Employee
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Payment
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {bookings.map(
                    (booking) => (
                      <tr
                        key={booking.id}
                        className="border-b transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#03162F]">
                            {formatDate(
                              booking.booking_date
                            )}
                          </div>

                          {booking.booking_time && (
                            <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTime(
                                booking.booking_time
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-[#03162F]">
                            {booking.customers
                              ?.full_name ??
                              "Walk-in / Unknown"}
                          </div>

                          {booking.customers?.phone && (
                            <div className="mt-1 text-sm text-slate-500">
                              {booking.customers.phone}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {booking.businesses
                            ?.name ?? "—"}
                        </td>

                        <td className="px-6 py-4">
                          {booking
                            .enterprise_catalog
                            ?.name ?? "—"}
                        </td>

                        <td className="px-6 py-4">
                          {booking.employees
                            ?.full_name ?? "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass[booking.status]}`}
                          >
                            {booking.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentClass[booking.payment_status]}`}
                          >
                            {booking.payment_status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right font-semibold text-[#03162F]">
                          {formatMoney(
                            Number(
                              booking.amount ??
                                0
                            )
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            ref={(element) => {
                              menuButtonRefs.current[
                                booking.id
                              ] = element;
                            }}
                            type="button"
                            onClick={() =>
                              toggleMenu(
                                booking.id
                              )
                            }
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
                                openMenuId ===
                                booking.id
                                  ? "border-[#D4AF37] bg-[#03162F] text-white"
                                  : "border-slate-300 bg-white text-[#03162F] hover:border-[#D4AF37] hover:bg-slate-50"
                              }
                            `}
                            aria-haspopup="menu"
                            aria-expanded={
                              openMenuId ===
                              booking.id
                            }
                          >
                            Actions

                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                openMenuId ===
                                booking.id
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </button>

                          {renderActionMenu(
                            booking
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {renderFormModal()}
      {renderViewModal()}
      {renderActionModal()}
    </>
  );
}