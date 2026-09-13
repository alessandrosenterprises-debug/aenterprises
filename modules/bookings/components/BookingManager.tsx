"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit3,
  Eye,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
  X,
  CircleX,
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

type ModalMode = "create" | "view" | "edit" | null;

type ActionType =
  | "confirm"
  | "complete"
  | "reject"
  | "cancel"
  | "delete"
  | null;

const statusClass: Record<Booking["status"], string> = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-slate-200 text-slate-600",
};

const paymentClass: Record<
  Booking["payment_status"],
  string
> = {
  Pending: "bg-amber-100 text-amber-700",
  Partial: "bg-blue-100 text-blue-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Refunded: "bg-red-100 text-red-700",
};

const statusOptions: Booking["status"][] = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

const paymentOptions: Booking["payment_status"][] = [
  "Pending",
  "Partial",
  "Paid",
  "Refunded",
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ZM", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "";

  const parts = value.split(":");

  if (parts.length < 2) {
    return value;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-ZM", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getActionLabel(action: Exclude<ActionType, null>) {
  switch (action) {
    case "confirm":
      return "Confirm Booking";
    case "complete":
      return "Complete Booking";
    case "reject":
      return "Reject Booking";
    case "cancel":
      return "Cancel Booking";
    case "delete":
      return "Delete Booking";
  }
}

function getActionDescription(
  action: Exclude<ActionType, null>
) {
  switch (action) {
    case "confirm":
      return "This will mark the booking as confirmed.";
    case "complete":
      return "This will mark the booking as completed.";
    case "reject":
      return "This will cancel the booking.";
    case "cancel":
      return "This will cancel the booking.";
    case "delete":
      return "This will permanently remove the booking record.";
  }
}

export default function BookingManager({
  bookings,
  formData,
}: BookingManagerProps) {
  const router = useRouter();

  const [modalMode, setModalMode] =
    useState<ModalMode>(null);

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [action, setAction] =
    useState<ActionType>(null);

  const [actionBooking, setActionBooking] =
    useState<Booking | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);
    
    const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

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
    useState<Booking["status"]>("Pending");

  const [paymentStatus, setPaymentStatus] =
    useState<Booking["payment_status"]>("Pending");

  const [notes, setNotes] =
    useState("");

  const menuButtonRefs =
    useRef<Record<string, HTMLButtonElement | null>>(
      {}
    );

  const [menuPosition, setMenuPosition] =
    useState({
      top: 0,
      left: 0,
    });

  /*
   * ---------------------------------------------------------
   * FORM DATA FILTERING
   * ---------------------------------------------------------
   */

  const businesses = useMemo(
    () => formData.businesses,
    [formData.businesses]
  );

  /*
   * IMPORTANT:
   *
   * Customers are ENTERPRISE-WIDE.
   *
   * Do NOT filter customers by business_id.
   */
  const customers = useMemo(
    () => formData.customers,
    [formData.customers]
  );

  const employees = useMemo(
    () =>
      formData.employees.filter(
        (employee) =>
          !businessId ||
          employee.business_id === businessId
      ),
    [formData.employees, businessId]
  );

  const branches = useMemo(
    () =>
      formData.branches.filter(
        (branch) =>
          !businessId ||
          branch.business_id === businessId
      ),
    [formData.branches, businessId]
  );

  /*
   * SERVICES ARE BUSINESS-SPECIFIC.
   *
   * booking.service.ts already guarantees that these
   * catalog items are:
   *
   * - Active
   * - item_type = Service
   *
   * Here we additionally restrict them to the selected
   * business.
   */
  const services = useMemo(
    () =>
      formData.catalogItems.filter(
        (item) =>
          item.business_id === businessId
      ),
    [formData.catalogItems, businessId]
  );

  /*
   * ---------------------------------------------------------
   * FORM RESET
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
    setError(null);
  }

  /*
   * ---------------------------------------------------------
   * LOAD BOOKING INTO FORM
   * ---------------------------------------------------------
   */

  function loadBookingIntoForm(booking: Booking) {
    setBusinessId(booking.business_id ?? "");
    setCustomerId(booking.customer_id ?? "");
    setEmployeeId(booking.employee_id ?? "");
    setBranchId(booking.branch_id ?? "");
    setCatalogItemId(
      booking.catalog_item_id ?? ""
    );
    setBookingDate(booking.booking_date ?? "");
    setBookingTime(booking.booking_time ?? "");
    setAmount(
      String(Number(booking.amount ?? 0))
    );
    setStatus(booking.status);
    setPaymentStatus(booking.payment_status);
    setNotes(booking.notes ?? "");
    setError(null);
  }

  /*
   * ---------------------------------------------------------
   * MODAL CONTROLS
   * ---------------------------------------------------------
   */

  function openCreate() {
    setOpenMenuId(null);
    setSelectedBooking(null);
    resetForm();
    setModalMode("create");
  }

  function openView(booking: Booking) {
    setOpenMenuId(null);
    setSelectedBooking(booking);
    setModalMode("view");
  }

  function openEdit(booking: Booking) {
    setOpenMenuId(null);
    setSelectedBooking(booking);
    loadBookingIntoForm(booking);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedBooking(null);
    setError(null);
  }

  /*
   * ---------------------------------------------------------
   * BUSINESS CHANGE
   * ---------------------------------------------------------
   */

  function handleBusinessChange(value: string) {
    setBusinessId(value);

    /*
     * Customer stays selected because customers are
     * enterprise-wide.
     */

    /*
     * These records belong to the selected business,
     * so clear them when the business changes.
     */
    setEmployeeId("");
    setBranchId("");
    setCatalogItemId("");
    setAmount("");
  }

  /*
   * ---------------------------------------------------------
   * SERVICE CHANGE
   * ---------------------------------------------------------
   */

  function handleCatalogChange(value: string) {
    setCatalogItemId(value);

    const selectedService =
      formData.catalogItems.find(
        (item) => item.id === value
      );

    if (selectedService) {
      setAmount(
        String(
          Number(
            selectedService.base_price ?? 0
          )
        )
      );
    } else {
      setAmount("");
    }
  }

  /*
   * ---------------------------------------------------------
   * EMPLOYEE CHANGE
   * ---------------------------------------------------------
   */

  function handleEmployeeChange(value: string) {
    setEmployeeId(value);

    const employee =
      formData.employees.find(
        (item) => item.id === value
      );

    if (
      employee?.branch_id &&
      branches.some(
        (branch) =>
          branch.id === employee.branch_id
      )
    ) {
      setBranchId(employee.branch_id);
    }
  }

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    if (!businessId) {
      setError(
        "Please select the business receiving this booking."
      );
      return;
    }

    if (!customerId) {
      setError(
        "Please select a customer."
      );
      return;
    }

    if (!catalogItemId) {
      setError(
        "Please select a service."
      );
      return;
    }

    if (!bookingDate) {
      setError(
        "Please select a booking date."
      );
      return;
    }

    const selectedService =
      formData.catalogItems.find(
        (item) => item.id === catalogItemId
      );

    if (
      !selectedService ||
      selectedService.business_id !== businessId
    ) {
      setError(
        "The selected service does not belong to the selected business."
      );
      return;
    }

    const payload: BookingPayload = {
      business_id: businessId,
      customer_id: customerId || null,
      employee_id: employeeId || null,
      branch_id: branchId || null,
      catalog_item_id: catalogItemId || null,
      booking_date: bookingDate,
      booking_time: bookingTime || null,
      status,
      payment_status: paymentStatus,
      amount: Number(amount || 0),
      notes: notes.trim() || null,
    };

    try {
      setProcessing(true);

      if (
        modalMode === "edit" &&
        selectedBooking
      ) {
        await updateBooking(
          selectedBooking.id,
          payload
        );
      } else {
        await createBooking(payload);
      }

      closeModal();
      router.refresh();
    } catch (err) {
      console.error(
        "Booking save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save booking."
      );
    } finally {
      setProcessing(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * ACTION MENU
   * ---------------------------------------------------------
   */

  function toggleMenu(id: string) {
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }

    const button =
      menuButtonRefs.current[id];

    if (button) {
      const rect =
        button.getBoundingClientRect();

      setMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(
          12,
          rect.right - 210
        ),
      });
    }

    setOpenMenuId(id);
  }

  function closeAction() {
    setAction(null);
    setActionBooking(null);
    setError(null);
  }

  function openAction(
    booking: Booking,
    actionType: Exclude<ActionType, null>
  ) {
    setOpenMenuId(null);
    setActionBooking(booking);
    setAction(actionType);
    setError(null);
  }

  /*
   * ---------------------------------------------------------
   * EXECUTE ACTION
   * ---------------------------------------------------------
   */

  async function executeAction() {
    if (!action || !actionBooking) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      if (action === "delete") {
        await deleteBooking(
          actionBooking.id
        );
      } else {
        let nextStatus:
          | Booking["status"]
          | undefined;

        if (action === "confirm") {
          nextStatus = "Confirmed";
        }

        if (action === "complete") {
          nextStatus = "Completed";
        }

        if (
          action === "cancel" ||
          action === "reject"
        ) {
          nextStatus = "Cancelled";
        }

        if (nextStatus) {
          await updateBooking(
            actionBooking.id,
            {
              business_id:
                actionBooking.business_id,
              customer_id:
                actionBooking.customer_id,
              employee_id:
                actionBooking.employee_id,
              branch_id:
                actionBooking.branch_id,
              catalog_item_id:
                actionBooking.catalog_item_id,
              booking_date:
                actionBooking.booking_date,
              booking_time:
                actionBooking.booking_time,
              status: nextStatus,
              payment_status:
                actionBooking.payment_status,
              amount: Number(
                actionBooking.amount ?? 0
              ),
              notes:
                actionBooking.notes,
            }
          );
        }
      }

      closeAction();
      router.refresh();
    } catch (err) {
      console.error(
        "Booking action error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete this action."
      );
    } finally {
      setProcessing(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * OUTSIDE CLICK / ESCAPE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    function handleClick(event: MouseEvent) {
  const target = event.target as Node;

  if (!openMenuId) {
    return;
  }

  const clickedButton =
    menuButtonRefs.current[openMenuId]?.contains(target);

  const clickedMenu =
    actionMenuRef.current?.contains(target);

  if (!clickedButton && !clickedMenu) {
    setOpenMenuId(null);
  }
}

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [openMenuId]);

  /*
   * ---------------------------------------------------------
   * ACTION MENU RENDER
   * ---------------------------------------------------------
   */

  function renderActionMenu(
    booking: Booking
  ) {
    if (openMenuId !== booking.id) {
      return null;
    }

    return createPortal(
      <div
  ref={actionMenuRef}
  className="fixed z-[9500] w-[210px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
        }}
        role="menu"
      >
        <button
          type="button"
          onClick={() =>
            openView(booking)
          }
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>

        <button
          type="button"
          onClick={() =>
            openEdit(booking)
          }
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Edit3 className="h-4 w-4" />
          Edit Booking
        </button>

        {booking.status === "Pending" && (
          <button
            type="button"
            onClick={() =>
              openAction(
                booking,
                "confirm"
              )
            }
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            <Check className="h-4 w-4" />
            Confirm
          </button>
        )}

        {booking.status === "Confirmed" && (
          <button
            type="button"
            onClick={() =>
              openAction(
                booking,
                "complete"
              )
            }
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </button>
        )}

        {booking.status !==
          "Cancelled" &&
          booking.status !==
            "Completed" && (
            <button
              type="button"
              onClick={() =>
                openAction(
                  booking,
                  "cancel"
                )
              }
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <CircleX className="h-4 w-4" />
              Cancel
            </button>
          )}

        <div className="my-1 border-t border-slate-100" />

        <button
          type="button"
          onClick={() =>
            openAction(
              booking,
              "delete"
            )
          }
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>,
      document.body
    );
  }

  /*
   * ---------------------------------------------------------
   * FORM MODAL
   * ---------------------------------------------------------
   */

  function renderFormModal() {
    if (
      modalMode !== "create" &&
      modalMode !== "edit"
    ) {
      return null;
    }

    const selectedService =
      formData.catalogItems.find(
        (item) =>
          item.id === catalogItemId
      );

    return (
      <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#03162F]/60 p-4 backdrop-blur-sm">
        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-[#03162F]">
                {modalMode === "edit"
                  ? "Edit Booking"
                  : "New Booking"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the customer, business and
                service for this booking.
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

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* CUSTOMER */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Customer
              </label>

              <select
                value={customerId}
                onChange={(event) =>
                  setCustomerId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              >
                <option value="">
                  Select customer
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

              <p className="mt-1.5 text-xs text-slate-400">
                Customers are shared across Alessandro
                Enterprises.
              </p>
            </div>

            {/* BUSINESS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Business
              </label>

              <select
                value={businessId}
                onChange={(event) =>
                  handleBusinessChange(
                    event.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              >
                <option value="">
                  Select business
                </option>

                {businesses.map(
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
            </div>

            {/* SERVICE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Service
              </label>

              <select
                value={catalogItemId}
                onChange={(event) =>
                  handleCatalogChange(
                    event.target.value
                  )
                }
                disabled={!businessId}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              >
                <option value="">
                  {!businessId
                    ? "Select a business first"
                    : services.length === 0
                    ? "No active services for this business"
                    : "Select service"}
                </option>

                {services.map(
                  (service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {service.name}
                    </option>
                  )
                )}
              </select>

              {selectedService && (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">
                    Service price
                  </span>

                  <span className="font-semibold text-[#03162F]">
                    {formatMoney(
                      Number(
                        selectedService.base_price ??
                          0
                      )
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* DATE + TIME */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Booking Date
                </label>

                <input
                  type="date"
                  value={bookingDate}
                  onChange={(event) =>
                    setBookingDate(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Booking Time
                </label>

                <input
                  type="time"
                  value={bookingTime}
                  onChange={(event) =>
                    setBookingTime(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>

            {/* STATUS + PAYMENT */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Booking Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as Booking["status"]
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  {statusOptions.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Status
                </label>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(
                      event.target.value as Booking["payment_status"]
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  {paymentOptions.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* AMOUNT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Amount
              </label>

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
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Automatically populated from the selected
                service. You can adjust it if necessary.
              </p>
            </div>

            {/* NOTES */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Add any booking notes or special instructions..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            {/* INTERNAL ASSIGNMENTS */}
            {(employees.length > 0 ||
              branches.length > 0) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="mb-4 text-sm font-bold text-[#03162F]">
                  Internal Assignment
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Employee
                    </label>

                    <select
                      value={employeeId}
                      onChange={(event) =>
                        handleEmployeeChange(
                          event.target.value
                        )
                      }
                      disabled={!businessId}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:bg-slate-100 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    >
                      <option value="">
                        Not assigned
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
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Branch
                    </label>

                    <select
                      value={branchId}
                      onChange={(event) =>
                        setBranchId(
                          event.target.value
                        )
                      }
                      disabled={!businessId}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition disabled:bg-slate-100 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    >
                      <option value="">
                        Not assigned
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
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={closeModal}
                disabled={processing}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-6 py-3 font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {processing
                  ? "Saving..."
                  : modalMode === "edit"
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

    const booking = selectedBooking;

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
                  {booking.businesses?.name ??
                    "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Service
                </p>

                <p className="mt-2 font-semibold text-[#03162F]">
                  {booking.enterprise_catalog
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
                  {booking.branches?.name ??
                    "—"}
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
              {action === "delete" ? (
                <Trash2 className="h-6 w-6" />
              ) : action === "complete" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : action === "confirm" ? (
                <Check className="h-6 w-6" />
              ) : (
                <CircleX className="h-6 w-6" />
              )}
            </div>

            <h2 className="mt-5 text-center text-xl font-bold text-[#03162F]">
              {getActionLabel(action)}
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-slate-500">
              {getActionDescription(action)}
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
              <p className="font-semibold text-[#03162F]">
                {actionBooking.customers
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
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  destructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#03162F] hover:bg-[#0A2852]"
                }`}
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
                Customer bookings will appear here once
                they are created.
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
                      Service
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
                          {booking.businesses?.name ??
                            "—"}
                        </td>

                        <td className="px-6 py-4">
                          {booking.enterprise_catalog
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
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                              openMenuId ===
                              booking.id
                                ? "border-[#D4AF37] bg-[#03162F] text-white"
                                : "border-slate-300 bg-white text-[#03162F] hover:border-[#D4AF37] hover:bg-slate-50"
                            }`}
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