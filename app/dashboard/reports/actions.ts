"use server";

import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 500;

interface BusinessRef {
  id: string;
  name: string;
  slug?: string;
}

export type ReportBusiness = BusinessRef;

export interface ReportBooking {
  id: string;
  business_id: string;
  customer_id: string | null;
  booking_date: string;
  booking_time: string | null;
  status: string;
  payment_status: string;
  amount: number | string | null;
  businesses?: { id: string; name: string } | null;
  customers?: { id: string; full_name: string; phone?: string | null } | null;
  enterprise_catalog?: { id: string; name: string; item_type: string } | null;
}

export interface ReportOrder {
  id: string;
  business_id: string;
  customer_id: string | null;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  total_amount: number | string | null;
  created_at: string;
  businesses?: { id: string; name: string; slug?: string } | null;
  customers?: { id: string; full_name: string; phone?: string | null } | null;
  rider?: { id: string; full_name: string; phone?: string | null } | null;
}

export interface ReportLoanApplication {
  id: string;
  customer_id: string;
  loan_type: string;
  requested_amount: number | string;
  approved_amount: number | string | null;
  amount_paid: number | string | null;
  status: string;
  application_source: string;
  application_date: string;
  customers?: { id: string; full_name: string; phone?: string | null } | null;
}

export interface BusinessReportRow {
  business_id: string;
  business_name: string;
  bookings: number;
  orders: number;
  courier_deliveries: number;
  loan_applications: number;
  revenue: number;
}

export interface ReportStats {
  totalBookings: number;
  totalOrders: number;
  courierDeliveries: number;
  loanApplications: number;
  totalRevenue: number;
  customersServed: number;
  pendingBookings: number;
  pendingOrders: number;
  pendingLoanApplications: number;
}

export interface ReportResult {
  businesses: ReportBusiness[];
  bookings: ReportBooking[];
  orders: ReportOrder[];
  loanApplications: ReportLoanApplication[];
  businessPerformance: BusinessReportRow[];
  stats: ReportStats;
  warnings: string[];
}

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

async function readAllPages<T>(
  queryPage: (from: number, to: number) => PromiseLike<QueryResult>,
): Promise<{ data: T[]; error: string | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error: error.message };
    const page = Array.isArray(data) ? data as T[] : [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { data: rows, error: null };
  }
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function nextDate(value: string) {
  const next = new Date(`${value}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
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
  if (!isDate(fromDate) || !isDate(toDate) || fromDate > toDate) {
    throw new Error("Choose a valid report date range.");
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Sign in to view enterprise reports.");

  const { data: businessRows, error: businessesError } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .order("name");
  if (businessesError) throw new Error("Unable to load the enterprise business list.");
  const businesses = (businessRows ?? []) as ReportBusiness[];
  const softLoansBusinessId = businesses.find((business) => business.slug === "soft-loans")?.id;
  const includeLoans = !businessId || businessId === softLoansBusinessId;
  const fromTimestamp = `${fromDate}T00:00:00+02:00`;
  const toTimestamp = `${nextDate(toDate)}T00:00:00+02:00`;

  const [bookingResult, orderResult, loanResult] = await Promise.all([
    readAllPages<ReportBooking>((from, to) => {
      let query = supabase
        .from("bookings")
        .select("id, business_id, customer_id, booking_date, booking_time, status, payment_status, amount, businesses(id,name), customers(id,full_name,phone), enterprise_catalog(id,name,item_type)")
        .gte("booking_date", fromDate)
        .lte("booking_date", toDate)
        .order("booking_date", { ascending: false })
        .range(from, to);
      if (businessId) query = query.eq("business_id", businessId);
      return query;
    }),
    readAllPages<ReportOrder>((from, to) => {
      let query = supabase
        .from("orders")
        .select("id, business_id, customer_id, status, payment_status, fulfillment_method, total_amount, created_at, businesses(id,name,slug), customers(id,full_name,phone), rider:employees!orders_rider_employee_id_fkey(id,full_name,phone)")
        .gte("created_at", fromTimestamp)
        .lt("created_at", toTimestamp)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (businessId) query = query.eq("business_id", businessId);
      return query;
    }),
    includeLoans
      ? readAllPages<ReportLoanApplication>((from, to) => {
          return supabase
            .from("customer_loan_applications")
            .select("id, customer_id, loan_type, requested_amount, approved_amount, amount_paid, status, application_source, application_date, customers(id,full_name,phone)")
            .gte("application_date", fromDate)
            .lte("application_date", toDate)
            .order("application_date", { ascending: false })
            .range(from, to);
        })
      : Promise.resolve({ data: [] as ReportLoanApplication[], error: null }),
  ]);

  const warnings = [
    bookingResult.error ? "Bookings report could not be loaded." : null,
    orderResult.error ? "Orders and courier report could not be loaded." : null,
    loanResult.error ? "Loan applications report could not be loaded." : null,
  ].filter((warning): warning is string => Boolean(warning));
  const bookings = bookingResult.data.map((booking) => ({
    ...booking,
    businesses: normalizeRelation(booking.businesses as ReportBooking["businesses"] | ReportBooking["businesses"][]),
    customers: normalizeRelation(booking.customers as ReportBooking["customers"] | ReportBooking["customers"][]),
    enterprise_catalog: normalizeRelation(booking.enterprise_catalog as ReportBooking["enterprise_catalog"] | ReportBooking["enterprise_catalog"][]),
  }));
  const orders = orderResult.data.map((order) => ({
    ...order,
    businesses: normalizeRelation(order.businesses as ReportOrder["businesses"] | ReportOrder["businesses"][]),
    customers: normalizeRelation(order.customers as ReportOrder["customers"] | ReportOrder["customers"][]),
    rider: normalizeRelation(order.rider as ReportOrder["rider"] | ReportOrder["rider"][]),
  }));
  const loanApplications = loanResult.data.map((application) => ({
    ...application,
    customers: normalizeRelation(application.customers as ReportLoanApplication["customers"] | ReportLoanApplication["customers"][]),
  }));
  const isCourierOrder = (order: ReportOrder) => order.businesses?.slug === "delivery-service";
  const courierDeliveries = orders.filter(isCourierOrder);

  const uniqueCustomers = new Set<string>();
  bookings.forEach((booking) => booking.customer_id && uniqueCustomers.add(booking.customer_id));
  orders.forEach((order) => order.customer_id && uniqueCustomers.add(order.customer_id));
  loanApplications.forEach((application) => application.customer_id && uniqueCustomers.add(application.customer_id));

  const performance = new Map<string, BusinessReportRow>(businesses.map((business) => [business.id, {
    business_id: business.id,
    business_name: business.name,
    bookings: 0,
    orders: 0,
    courier_deliveries: 0,
    loan_applications: 0,
    revenue: 0,
  }]));
  const addRevenue = (businessKey: string | undefined, value: number) => {
    if (!businessKey) return;
    const row = performance.get(businessKey);
    if (row) row.revenue += value;
  };

  for (const booking of bookings) {
    const row = performance.get(booking.business_id);
    if (row) row.bookings += 1;
    if (booking.payment_status.toLowerCase() === "paid") addRevenue(booking.business_id, Number(booking.amount ?? 0));
  }
  for (const order of orders) {
    const row = performance.get(order.business_id);
    if (row) {
      if (isCourierOrder(order)) row.courier_deliveries += 1;
      else row.orders += 1;
    }
    if (order.payment_status.toLowerCase() === "paid") addRevenue(order.business_id, Number(order.total_amount ?? 0));
  }
  if (softLoansBusinessId) {
    const row = performance.get(softLoansBusinessId);
    if (row) row.loan_applications = loanApplications.length;
    for (const application of loanApplications) addRevenue(softLoansBusinessId, Number(application.amount_paid ?? 0));
  }

  const paidBookings = bookings.filter((booking) => booking.payment_status === "Paid");
  const paidOrders = orders.filter((order) => order.payment_status === "Paid");
  const stats: ReportStats = {
    totalBookings: bookings.length,
    totalOrders: orders.length - courierDeliveries.length,
    courierDeliveries: courierDeliveries.length,
    loanApplications: loanApplications.length,
    totalRevenue:
      paidBookings.reduce((sum, booking) => sum + Number(booking.amount ?? 0), 0) +
      paidOrders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0) +
      loanApplications.reduce((sum, application) => sum + Number(application.amount_paid ?? 0), 0),
    customersServed: uniqueCustomers.size,
    pendingBookings: bookings.filter((booking) => booking.status.toLowerCase() === "pending").length,
    pendingOrders: orders.filter((order) => !isCourierOrder(order) && order.status.toLowerCase() === "pending").length,
    pendingLoanApplications: loanApplications.filter((application) => ["pending", "under review"].includes(application.status.toLowerCase())).length,
  };

  return {
    businesses,
    bookings,
    orders,
    loanApplications,
    businessPerformance: Array.from(performance.values()).sort((a, b) => b.revenue - a.revenue || a.business_name.localeCompare(b.business_name)),
    stats,
    warnings,
  };
}
