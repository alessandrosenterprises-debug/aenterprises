"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  UserRound,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  city: string | null;
}

interface Employee {
  id: string;
  full_name: string;
  position: string;
  branch_id: string | null;
}

interface BookingFormProps {
  serviceId: string;
  businessId: string;
  customerId: string | null;
  serviceName: string;
  price: string | null;
  branches: Branch[];
  employees: Employee[];
}

export default function BookingForm({
  serviceId,
  businessId,
  customerId,
  serviceName,
  price,
  branches,
  employees,
}: BookingFormProps) {
  const router = useRouter();

  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [branchId, setBranchId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const filteredEmployees = branchId
    ? employees.filter(
        (employee) =>
          !employee.branch_id || employee.branch_id === branchId
      )
    : employees;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!customerId) {
      setError(
        "Your customer profile is not connected to your account."
      );
      return;
    }

    if (!bookingDate) {
      setError("Please select an appointment date.");
      return;
    }

    if (!bookingTime) {
      setError("Please select an appointment time.");
      return;
    }

    if (branches.length > 0 && !branchId) {
      setError("Please select a branch.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/customer/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  catalog_item_id: serviceId,
  business_id: businessId,
  branch_id: branchId || null,
  employee_id: employeeId || null,
  booking_date: bookingDate,
  booking_time: bookingTime,
  notes: notes.trim() || null,
}),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "We could not create your booking."
        );
      }

      router.push(
        `/customer/bookings?success=booking&bookingId=${result.booking.id}`
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating your booking."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-6">
      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            Booking could not be completed
          </p>

          <p className="mt-1 text-sm leading-6 text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* DATE */}

      <div>
        <label
          htmlFor="booking_date"
          className="mb-2 block text-sm font-semibold text-[#03162F]"
        >
          Appointment Date
        </label>

        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="booking_date"
            name="booking_date"
            type="date"
            required
            min={today}
            value={bookingDate}
            onChange={(event) =>
              setBookingDate(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
          />
        </div>
      </div>

      {/* TIME */}

      <div>
        <label
          htmlFor="booking_time"
          className="mb-2 block text-sm font-semibold text-[#03162F]"
        >
          Appointment Time
        </label>

        <div className="relative">
          <Clock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="booking_time"
            name="booking_time"
            type="time"
            required
            value={bookingTime}
            onChange={(event) =>
              setBookingTime(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
          />
        </div>
      </div>

      {/* BRANCH */}

      <div>
        <label
          htmlFor="branch_id"
          className="mb-2 block text-sm font-semibold text-[#03162F]"
        >
          Branch
        </label>

        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <select
            id="branch_id"
            name="branch_id"
            required={branches.length > 0}
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              setEmployeeId("");
            }}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
          >
            <option value="">
              {branches.length > 0
                ? "Select a branch"
                : "No branches available"}
            </option>

            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
                {branch.city ? ` — ${branch.city}` : ""}
              </option>
            ))}
          </select>
        </div>

        {branches.length === 0 && (
          <p className="mt-2 text-xs text-amber-600">
            No active branch has been configured for this business
            yet.
          </p>
        )}
      </div>

      {/* STAFF */}

      <div>
        <label
          htmlFor="employee_id"
          className="mb-2 block text-sm font-semibold text-[#03162F]"
        >
          Staff Member
        </label>

        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <select
            id="employee_id"
            name="employee_id"
            value={employeeId}
            onChange={(event) =>
              setEmployeeId(event.target.value)
            }
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
          >
            <option value="">
              Any available staff member
            </option>

            {filteredEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
                {employee.position
                  ? ` — ${employee.position}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {employees.length === 0 && (
          <p className="mt-2 text-xs text-slate-500">
            No active staff members are currently listed.
          </p>
        )}
      </div>

      {/* NOTES */}

      <div>
        <label
          htmlFor="notes"
          className="mb-2 block text-sm font-semibold text-[#03162F]"
        >
          Notes
          <span className="ml-1 font-normal text-slate-400">
            (optional)
          </span>
        </label>

        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          placeholder="Add any information you would like us to know..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
        />
      </div>

      {/* PRICE */}

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Service
            </p>

            <p className="mt-1 text-sm font-semibold text-[#03162F]">
              {serviceName}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">
              Amount
            </p>

            <p className="mt-1 text-lg font-bold text-[#03162F]">
              {price || "Price not set"}
            </p>
          </div>
        </div>
      </div>

      {/* SUBMIT */}

      <button
        type="submit"
        disabled={!customerId || submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0a2549] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <CheckCircle2 className="h-5 w-5" />

        {submitting ? "Creating Booking..." : "Confirm Booking"}
      </button>

      <p className="text-center text-xs leading-5 text-slate-400">
        Your booking will be created as{" "}
        <span className="font-semibold">Pending</span> until it is
        confirmed by the business.
      </p>
    </form>
  );
}