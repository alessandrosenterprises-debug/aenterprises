import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "./BookingForm";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    serviceId: string;
  }>;
}

interface CatalogItem {
  id: string;
  business_id: string;
  item_type: string;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  quantity: number | null;
  status: string | null;
  image_url: string | null;
  attributes: Record<string, unknown> | null;

  businesses?: {
    id: string;
    name: string;
  } | null;
}

interface Branch {
  id: string;
  business_id: string;
  name: string;
  code: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  manager_name: string | null;
  active: boolean;
}

interface Employee {
  id: string;
  business_id: string | null;
  branch_id: string | null;
  full_name: string;
  phone: string;
  position: string;
  is_active: boolean | null;
  status: string | null;
}

function formatMoney(amount: number | null) {
  if (amount === null || amount === undefined) {
    return null;
  }

  return `ZMW ${Number(amount).toFixed(2)}`;
}

export default async function BookingServicePage({
  params,
}: PageProps) {
  const { serviceId } = await params;

  const supabase = await createClient();

  // ============================================================
  // AUTHENTICATED USER
  // ============================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/customer/login");
  }

  // ============================================================
  // CUSTOMER
  // ============================================================

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  let customer: {
    id: string;
    full_name: string;
    phone: string;
  } | null = null;

  if (profile?.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", profile.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && user.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", user.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && profile?.phone) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("phone", profile.phone)
      .maybeSingle();

    customer = data;
  }

  // ============================================================
  // SELECTED SERVICE
  // ============================================================

  const { data: serviceData, error: serviceError } =
    await supabase
      .from("enterprise_catalog")
      .select(`
        id,
        business_id,
        item_type,
        category,
        name,
        description,
        base_price,
        quantity,
        status,
        image_url,
        attributes,

        businesses (
          id,
          name
        )
      `)
      .eq("id", serviceId)
      .eq("item_type", "service")
      .eq("status", "Active")
      .maybeSingle();

  if (serviceError) {
    console.error(
      "Booking service error:",
      serviceError
    );
  }

  if (!serviceData) {
    notFound();
  }

  const service = serviceData as unknown as CatalogItem;

  // ============================================================
  // BRANCHES
  // ============================================================

  const { data: branchData, error: branchError } =
    await supabase
      .from("branches")
      .select(`
        id,
        business_id,
        name,
        code,
        description,
        address,
        city,
        phone,
        email,
        manager_name,
        active
      `)
      .eq("business_id", service.business_id)
      .eq("active", true)
      .order("name", {
        ascending: true,
      });

  if (branchError) {
    console.error(
      "Booking branches error:",
      branchError
    );
  }

  const branches = (branchData ?? []) as Branch[];

  // ============================================================
  // EMPLOYEES
  //
  // We load active employees belonging to the same business.
  // The booking form can later filter them by branch.
  // ============================================================

  const { data: employeeData, error: employeeError } =
    await supabase
      .from("employees")
      .select(`
        id,
        business_id,
        branch_id,
        full_name,
        phone,
        position,
        is_active,
        status
      `)
      .eq("business_id", service.business_id)
      .eq("is_active", true)
      .eq("status", "Active")
      .order("full_name", {
        ascending: true,
      });

  if (employeeError) {
    console.error(
      "Booking employees error:",
      employeeError
    );
  }

  const employees = (employeeData ?? []) as Employee[];

  // ============================================================
  // SERVICE DETAILS
  // ============================================================

  const attributes = service.attributes ?? {};

  const duration =
    typeof attributes.service_duration === "string"
      ? attributes.service_duration
      : null;

  const price = formatMoney(service.base_price);

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="bg-[#03162F] px-5 pb-10 pt-7 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/customer/bookings/new"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Services
          </Link>

          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Booking
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Book This Service
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Choose your preferred date, time, branch and staff
              member.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-5xl px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* ==================================================
              SERVICE SUMMARY
          ================================================== */}

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {service.image_url ? (
              <div className="relative h-64 bg-slate-100">
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center bg-slate-100 text-[#03162F]">
                <CalendarDays className="h-16 w-16 opacity-25" />
              </div>
            )}

            <div className="p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
                {service.businesses?.name ||
                  "Alessandro Enterprises"}
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#03162F]">
                {service.name}
              </h2>

              {service.category && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {service.category}
                </p>
              )}

              {service.description && (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {service.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {duration && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                    <Clock className="h-4 w-4 text-[#03162F]" />
                    {duration}
                  </div>
                )}

                {price && (
                  <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-[#03162F]">
                    {price}
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* ==================================================
              BOOKING FORM
          ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
                Appointment Details
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[#03162F]">
                Choose Your Appointment
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select when and where you would like to receive
                this service.
              </p>
            </div>

            {!customer && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Customer profile not found
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  Your account is not yet connected to a customer
                  profile. You can continue viewing the booking
                  information, but the booking cannot be submitted
                  until your customer profile is connected.
                </p>
              </div>
            )}

            <BookingForm
  serviceId={service.id}
  businessId={service.business_id}
  customerId={customer?.id ?? null}
  serviceName={service.name}
  price={price}
  branches={branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    city: branch.city,
  }))}
  employees={employees.map((employee) => ({
    id: employee.id,
    full_name: employee.full_name,
    position: employee.position,
    branch_id: employee.branch_id,
  }))}
/>          </div>
        </div>
      </section>
    </main>
  );
}