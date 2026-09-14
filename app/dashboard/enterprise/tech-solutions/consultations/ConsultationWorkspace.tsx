
"use client";

import {
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Filter,
  Mail,
  MessageSquareText,
  Phone,
  Search,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ConsultationRequest = {
  id: string;
  customer_id: string | null;
  business_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  consultation_type: string;
  preferred_date: string | null;
  preferred_time: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ConsultationWorkspaceProps = {
  consultations: ConsultationRequest[];
};

function formatDate(value: string | null) {
  if (!value) return "Not specified";

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

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ZM", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatConsultationType(value: string) {
  if (!value) return "General Consultation";

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * Database statuses:
 * Pending
 * Contacted
 * Scheduled
 * Completed
 * Cancelled
 *
 * We normalize them to lowercase for frontend comparisons.
 */
function normalizeStatus(value: string) {
  return value?.trim().toLowerCase() || "pending";
}

function getStatusLabel(status: string) {
  switch (normalizeStatus(status)) {
    case "pending":
      return "Pending";

    case "contacted":
      return "Contacted";

    case "scheduled":
      return "Scheduled";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return status || "Pending";
  }
}

function getStatusClasses(status: string) {
  switch (normalizeStatus(status)) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "scheduled":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "contacted":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getStatusDot(status: string) {
  switch (normalizeStatus(status)) {
    case "completed":
      return "bg-emerald-500";

    case "scheduled":
      return "bg-blue-500";

    case "contacted":
      return "bg-violet-500";

    case "cancelled":
      return "bg-red-500";

    default:
      return "bg-amber-500";
  }
}

export default function ConsultationWorkspace({
  consultations,
}: ConsultationWorkspaceProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedConsultation, setSelectedConsultation] =
    useState<ConsultationRequest | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const totalRequests = consultations.length;

  const pendingRequests = consultations.filter(
    (item) => normalizeStatus(item.status) === "pending"
  ).length;

  const contactedRequests = consultations.filter(
    (item) => normalizeStatus(item.status) === "contacted"
  ).length;

  const scheduledRequests = consultations.filter(
    (item) => normalizeStatus(item.status) === "scheduled"
  ).length;

  const completedRequests = consultations.filter(
    (item) => normalizeStatus(item.status) === "completed"
  ).length;

  const cancelledRequests = consultations.filter(
    (item) => normalizeStatus(item.status) === "cancelled"
  ).length;

  const consultationTypes = useMemo(() => {
    const types = consultations.map((item) => item.consultation_type);

    return Array.from(new Set(types.filter(Boolean))).sort();
  }, [consultations]);

  const filteredConsultations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return consultations.filter((consultation) => {
      const matchesSearch =
        !query ||
        consultation.name.toLowerCase().includes(query) ||
        consultation.phone.toLowerCase().includes(query) ||
        consultation.email?.toLowerCase().includes(query) ||
        consultation.subject?.toLowerCase().includes(query) ||
        consultation.message.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(consultation.status) === statusFilter.toLowerCase();

      const matchesType =
        typeFilter === "all" ||
        consultation.consultation_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [consultations, search, statusFilter, typeFilter]);

  const updateStatus = async (
    consultation: ConsultationRequest,
    nextStatus: "Pending" | "Contacted" | "Scheduled" | "Completed" | "Cancelled"
  ) => {
    if (loadingStatus) return;

    let confirmationMessage = "";

    switch (nextStatus) {
      case "Contacted":
        confirmationMessage = `Mark ${consultation.name}'s consultation request as contacted?`;
        break;

      case "Scheduled":
        confirmationMessage = `Schedule ${consultation.name}'s consultation request?`;
        break;

      case "Completed":
        confirmationMessage = `Mark ${consultation.name}'s consultation as completed?`;
        break;

      case "Cancelled":
        confirmationMessage = `Cancel ${consultation.name}'s consultation request?`;
        break;

      default:
        confirmationMessage = `Change ${consultation.name}'s consultation status to ${nextStatus}?`;
    }

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    try {
      setLoadingStatus(`${consultation.id}:${nextStatus}`);

      const response = await fetch(
        `/api/dashboard/technology-consultations/${consultation.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to update consultation."
        );
      }

      setSelectedConsultation(null);

      router.refresh();
    } catch (error) {
      console.error("Consultation status update failed:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update consultation."
      );
    } finally {
      setLoadingStatus(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all";

  return (
    <>
      {/* =========================================================
          SUMMARY
      ========================================================== */}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
            statusFilter === "all"
              ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/10"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                All Requests
              </p>

              <p className="mt-1 text-2xl font-bold text-[#03162F]">
                {totalRequests}
              </p>
            </div>

            <div className="rounded-xl bg-[#03162F]/10 p-2.5 text-[#03162F]">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
            statusFilter === "pending"
              ? "border-amber-400 ring-2 ring-amber-100"
              : "border-slate-200 hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pending
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-600">
                {pendingRequests}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("contacted")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
            statusFilter === "contacted"
              ? "border-violet-400 ring-2 ring-violet-100"
              : "border-slate-200 hover:border-violet-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contacted
              </p>

              <p className="mt-1 text-2xl font-bold text-violet-600">
                {contactedRequests}
              </p>
            </div>

            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
              <Phone className="h-5 w-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("scheduled")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
            statusFilter === "scheduled"
              ? "border-blue-400 ring-2 ring-blue-100"
              : "border-slate-200 hover:border-blue-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Scheduled
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-600">
                {scheduledRequests}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
            statusFilter === "completed"
              ? "border-emerald-400 ring-2 ring-emerald-100"
              : "border-slate-200 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Completed
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {completedRequests}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </button>
      </section>

      {/* =========================================================
          SEARCH / FILTER BAR
      ========================================================== */}

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, phone, email, subject..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/10"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full min-w-[160px] appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/10"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-11 min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/10"
            >
              <option value="all">All consultation types</option>

              {consultationTypes.map((type) => (
                <option key={type} value={type}>
                  {formatConsultationType(type)}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          RESULTS HEADER
      ========================================================== */}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#03162F]">
            Consultation Requests
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review and manage customer technology consultation requests.
          </p>
        </div>

        <div className="text-sm font-medium text-slate-500">
          Showing{" "}
          <span className="font-bold text-[#03162F]">
            {filteredConsultations.length}
          </span>{" "}
          of {totalRequests}
        </div>
      </div>

      {/* =========================================================
          EMPTY STATE
      ========================================================== */}

      {filteredConsultations.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#03162F]/10 text-[#03162F]">
            {hasFilters ? (
              <Search className="h-7 w-7" />
            ) : (
              <MessageSquareText className="h-7 w-7" />
            )}
          </div>

          <h3 className="mt-5 text-lg font-bold text-[#03162F]">
            {hasFilters
              ? "No matching consultations"
              : "No consultation requests yet"}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {hasFilters
              ? "Try changing your search or filters."
              : "Customer technology consultation requests will appear here automatically."}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#08294f]"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* =========================================================
          REQUEST CARDS
      ========================================================== */}

      <div className="mt-4 space-y-3">
        {filteredConsultations.map((consultation) => {
          const status = normalizeStatus(consultation.status);

          const contactedLoading =
            loadingStatus === `${consultation.id}:Contacted`;

          const scheduledLoading =
            loadingStatus === `${consultation.id}:Scheduled`;

          const completeLoading =
            loadingStatus === `${consultation.id}:Completed`;

          const cancelLoading =
            loadingStatus === `${consultation.id}:Cancelled`;

          return (
            <article
              key={consultation.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-[#D4AF37]/50 hover:shadow-md"
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* Customer */}

                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-[#03162F]">
                          {consultation.name}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusClasses(
                            consultation.status
                          )}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                              consultation.status
                            )}`}
                          />

                          {getStatusLabel(consultation.status)}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {formatConsultationType(
                          consultation.consultation_type
                        )}
                        {" • "}
                        {consultation.subject ||
                          "Technology Consultation"}
                      </p>
                    </div>
                  </div>

                  {/* Schedule */}

                  <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Preferred date
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <CalendarDays className="h-4 w-4 text-[#D4AF37]" />

                        {formatDate(consultation.preferred_date)}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Preferred time
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Clock3 className="h-4 w-4 text-[#D4AF37]" />

                        {consultation.preferred_time || "Any time"}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedConsultation(consultation)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/5"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>

                    <a
                      href={`tel:${consultation.phone}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>

                    {consultation.email && (
  <a
    href={`/dashboard/emails?compose=1&to=${encodeURIComponent(
      consultation.email
    )}`}
    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
  >
    <Mail className="h-4 w-4" />
    Email
  </a>
)}

                    {/* Pending -> Contacted */}

                    {status === "pending" && (
                      <button
                        type="button"
                        disabled={!!loadingStatus}
                        onClick={() =>
                          updateStatus(consultation, "Contacted")
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Phone className="h-4 w-4" />

                        {contactedLoading
                          ? "Contacting..."
                          : "Mark Contacted"}
                      </button>
                    )}

                    {/* Contacted -> Scheduled */}

                    {status === "contacted" && (
                      <button
                        type="button"
                        disabled={!!loadingStatus}
                        onClick={() =>
                          updateStatus(consultation, "Scheduled")
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CalendarDays className="h-4 w-4" />

                        {scheduledLoading
                          ? "Scheduling..."
                          : "Schedule"}
                      </button>
                    )}

                    {/* Scheduled -> Completed */}

                    {status === "scheduled" && (
                      <button
                        type="button"
                        disabled={!!loadingStatus}
                        onClick={() =>
                          updateStatus(consultation, "Completed")
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCheck className="h-4 w-4" />

                        {completeLoading
                          ? "Completing..."
                          : "Complete"}
                      </button>
                    )}

                    {/* Cancel */}

                    {(status === "pending" ||
                      status === "contacted" ||
                      status === "scheduled") && (
                      <button
                        type="button"
                        disabled={!!loadingStatus}
                        onClick={() =>
                          updateStatus(consultation, "Cancelled")
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />

                        {cancelLoading ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message preview */}

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                    {consultation.message}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    <span>
                      Submitted{" "}
                      {formatDateTime(consultation.created_at)}
                    </span>

                    <span className="hidden sm:inline">•</span>

                    <span className="font-mono">
                      {consultation.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* =========================================================
          VIEW MODAL
      ========================================================== */}

      {selectedConsultation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03162F]/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedConsultation(null);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="relative overflow-hidden bg-[#03162F] px-5 py-5 text-white sm:px-7">
              <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#D4AF37]/15 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
                    <MessageSquareText className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                      Technology Consultation
                    </p>

                    <h2 className="mt-1 truncate text-xl font-bold">
                      {selectedConsultation.name}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedConsultation(null)}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}

            <div className="max-h-[calc(92vh-180px)] overflow-y-auto p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                    selectedConsultation.status
                  )}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${getStatusDot(
                      selectedConsultation.status
                    )}`}
                  />

                  {getStatusLabel(selectedConsultation.status)}
                </span>

                <span className="font-mono text-xs text-slate-400">
                  {selectedConsultation.id}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 font-bold text-[#03162F]">
                    {selectedConsultation.name}
                  </p>

                  <a
                    href={`tel:${selectedConsultation.phone}`}
                    className="mt-2 flex items-center gap-2 text-sm text-slate-600 hover:text-[#03162F]"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedConsultation.phone}
                  </a>

                  {selectedConsultation.email && (
                    <a
                      href={`mailto:${selectedConsultation.email}`}
                      className="mt-1 flex items-center gap-2 truncate text-sm text-slate-600 hover:text-[#03162F]"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      {selectedConsultation.email}
                    </a>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Consultation
                  </p>

                  <p className="mt-1 font-bold text-[#03162F]">
                    {formatConsultationType(
                      selectedConsultation.consultation_type
                    )}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {selectedConsultation.subject ||
                      "Technology Consultation"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <CalendarDays className="h-4 w-4 text-[#D4AF37]" />
                    Preferred date
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {formatDate(
                      selectedConsultation.preferred_date
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Clock3 className="h-4 w-4 text-[#D4AF37]" />
                    Preferred time
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {selectedConsultation.preferred_time ||
                      "Any time"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-[#D4AF37]" />

                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Customer message
                  </p>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selectedConsultation.message}
                </p>
              </div>

              <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
                <div>
                  Customer ID:{" "}
                  <span className="font-mono text-slate-500">
                    {selectedConsultation.customer_id ||
                      "Not linked"}
                  </span>
                </div>

                <div className="sm:text-right">
                  Submitted:{" "}
                  <span className="text-slate-500">
                    {formatDateTime(
                      selectedConsultation.created_at
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`tel:${selectedConsultation.phone}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Phone className="h-4 w-4" />
                    Call Customer
                  </a>

                  {selectedConsultation.email && (
                    <a
                      href={`mailto:${selectedConsultation.email}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                    >
                      <Mail className="h-4 w-4" />
                      Email Customer
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Pending -> Contacted */}

                  {normalizeStatus(
                    selectedConsultation.status
                  ) === "pending" && (
                    <button
                      type="button"
                      disabled={!!loadingStatus}
                      onClick={() =>
                        updateStatus(
                          selectedConsultation,
                          "Contacted"
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
                    >
                      <Phone className="h-4 w-4" />
                      {loadingStatus ===
                      `${selectedConsultation.id}:Contacted`
                        ? "Contacting..."
                        : "Mark Contacted"}
                    </button>
                  )}

                  {/* Contacted -> Scheduled */}

                  {normalizeStatus(
                    selectedConsultation.status
                  ) === "contacted" && (
                    <button
                      type="button"
                      disabled={!!loadingStatus}
                      onClick={() =>
                        updateStatus(
                          selectedConsultation,
                          "Scheduled"
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CalendarDays className="h-4 w-4" />
                      {loadingStatus ===
                      `${selectedConsultation.id}:Scheduled`
                        ? "Scheduling..."
                        : "Schedule"}
                    </button>
                  )}

                  {/* Scheduled -> Completed */}

                  {normalizeStatus(
                    selectedConsultation.status
                  ) === "scheduled" && (
                    <button
                      type="button"
                      disabled={!!loadingStatus}
                      onClick={() =>
                        updateStatus(
                          selectedConsultation,
                          "Completed"
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCheck className="h-4 w-4" />
                      {loadingStatus ===
                      `${selectedConsultation.id}:Completed`
                        ? "Completing..."
                        : "Complete"}
                    </button>
                  )}

                  {/* Cancel */}

                  {["pending", "contacted", "scheduled"].includes(
                    normalizeStatus(selectedConsultation.status)
                  ) && (
                    <button
                      type="button"
                      disabled={!!loadingStatus}
                      onClick={() =>
                        updateStatus(
                          selectedConsultation,
                          "Cancelled"
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />

                      {loadingStatus ===
                      `${selectedConsultation.id}:Cancelled`
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedConsultation(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
