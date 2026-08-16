"use server";

import {
  getBookingsForReport,
} from "@/modules/bookings/services/booking.service";

import { createClient } from "@/lib/supabase/server";

export interface ReportBooking {
  id: string;
  business_id: string;
  customer_id: string | null;
  employee_id: string | null;
  branch_id: string | null;
  catalog_item_id: string | null;
  booking_date: string;
  booking_time: string | null;
  status: string;
  payment_status: string;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;

  businesses?: {
    id: string;
    name: string;
  } | null;

  customers?: {
    id: string;
    full_name: string;
    phone: string;
  } | null;

  employees?: {
    id: string;
    full_name: string;
  } | null;

  branches?: {
    id: string;
    name: string;
  } | null;

  enterprise_catalog?: {
    id: string;
    name: string;
    item_type: string;
  } | null;
}

export interface ReportBusiness {
  id: string;
  name: string;
}

export interface ReportStats {
  totalBookings: number;
  customersAttended: number;
  servicesCompleted: number;
  totalRevenue: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

export interface ReportResult {
  businesses: ReportBusiness[];
  bookings: ReportBooking[];
  stats: ReportStats;
}

export async function getReportData({
  fromDate,
  toDate,
  businessId,
}: {
  fromDate: string;
  toDate: string;
  businessId?: string;
}): Promise<ReportResult> {
  const supabase = await createClient();

  const [bookings, businessesResult] =
    await Promise.all([
      getBookingsForReport({
        fromDate,
        toDate,
        businessId,
      }),

      supabase
        .from("businesses")
        .select("id, name")
        .order("name"),
    ]);

  if (businessesResult.error) {
    console.error(
      "Report businesses error:",
      businessesResult.error
    );
  }

  const normalizedBookings =
    bookings as ReportBooking[];

  const completedBookings =
    normalizedBookings.filter(
      (booking) =>
        booking.status === "Completed"
    );

  /*
   * Count unique customers who attended.
   *
   * A customer with multiple completed bookings
   * during the selected period is counted once.
   */
  const attendedCustomerIds =
    new Set(
      completedBookings
        .map(
          (booking) =>
            booking.customer_id
        )
        .filter(
          (
            customerId
          ): customerId is string =>
            Boolean(customerId)
        )
    );

  const totalRevenue =
    completedBookings
      .filter(
        (booking) =>
          booking.payment_status ===
          "Paid"
      )
      .reduce(
        (total, booking) =>
          total +
          Number(booking.amount ?? 0),
        0
      );

  const stats: ReportStats = {
    totalBookings:
      normalizedBookings.length,

    customersAttended:
      attendedCustomerIds.size,

    servicesCompleted:
      completedBookings.length,

    totalRevenue,

    pending:
      normalizedBookings.filter(
        (booking) =>
          booking.status === "Pending"
      ).length,

    confirmed:
      normalizedBookings.filter(
        (booking) =>
          booking.status === "Confirmed"
      ).length,

    cancelled:
      normalizedBookings.filter(
        (booking) =>
          booking.status === "Cancelled"
      ).length,
  };

  return {
    businesses:
      businessesResult.data ??
      [],

    bookings:
      normalizedBookings,

    stats,
  };
}