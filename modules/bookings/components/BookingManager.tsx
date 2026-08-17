"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createBooking,
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

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

export default function BookingManager({
  bookings,
  formData,
}: BookingManagerProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [businessId, setBusinessId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [catalogItemId, setCatalogItemId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [amount, setAmount] = useState("");

  const [status, setStatus] =
    useState<BookingPayload["status"]>("Pending");

  const [paymentStatus, setPaymentStatus] =
    useState<BookingPayload["payment_status"]>("Pending");

  const [notes, setNotes] = useState("");

  const customers = useMemo(
    () =>
      formData.customers.filter(
        (customer) =>
          !businessId ||
          customer.business_id === businessId
      ),
    [formData.customers, businessId]
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

  const catalogItems = useMemo(
    () =>
      formData.catalogItems.filter(
        (item) =>
          !businessId ||
          item.business_id === businessId
      ),
    [formData.catalogItems, businessId]
  );

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

  function closeModal() {
    if (saving) return;

    setOpen(false);
    resetForm();
  }

  function handleBusinessChange(value: string) {
    setBusinessId(value);
    setCustomerId("");
    setEmployeeId("");
    setBranchId("");
    setCatalogItemId("");
    setAmount("");
  }

  function handleCatalogChange(value: string) {
    setCatalogItemId(value);

    const item = formData.catalogItems.find(
      (catalogItem) =>
        catalogItem.id === value
    );

    if (item) {
      setAmount(
        Number(item.base_price ?? 0).toFixed(2)
      );
    } else {
      setAmount("");
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!businessId) {
      setError("Please select a business.");
      return;
    }

    if (!bookingDate) {
      setError("Please select a booking date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createBooking({
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
      });

      setOpen(false);
      resetForm();

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create booking."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0A2852] hover:shadow-md"
        >
          <Plus size={18} />
          New Booking
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03162F]/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#03162F]">
                  New Booking
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new customer booking or appointment.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <X size={20} />
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
                {/* Business */}
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

                {/* Customer */}
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
                      Walk-in / Select customer
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

                {/* Service */}
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

                {/* Employee */}
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

                {/* Branch */}
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

                {/* Amount */}
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

                {/* Date */}
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

                {/* Time */}
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

                {/* Status */}
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

                {/* Payment */}
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

              {/* Notes */}
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Notes
                </span>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  className={`${inputClass} min-h-[110px] resize-y`}
                  placeholder="Optional booking notes..."
                />
              </label>

              {/* Actions */}
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
                  className="rounded-xl bg-[#03162F] px-6 py-3 font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Creating..."
                    : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}