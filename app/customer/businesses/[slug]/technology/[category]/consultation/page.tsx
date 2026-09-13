"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Laptop,
  Loader2,
  MessageSquare,
  Network,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";

interface ConsultationPageProps {
  params: Promise<{
    slug: string;
    category: string;
  }>;
}

const consultationTypes = [
  {
    value: "general",
    label: "General Technology Consultation",
    description: "Discuss your technology needs and possible solutions.",
    icon: Sparkles,
  },
  {
    value: "business",
    label: "Business Technology",
    description: "Technology planning, systems and digital business solutions.",
    icon: Network,
  },
  {
    value: "computer",
    label: "Computer & Laptop",
    description: "Advice about computers, laptops, upgrades or setup.",
    icon: Laptop,
  },
  {
    value: "software",
    label: "Software & Security",
    description: "Software, cybersecurity, licensing and protection advice.",
    icon: ShieldCheck,
  },
  {
    value: "networking",
    label: "Networking & Connectivity",
    description: "Internet, Wi-Fi, networking and connectivity solutions.",
    icon: Network,
  },
];

const preferredTimes = [
  "Morning — 08:00 to 12:00",
  "Afternoon — 12:00 to 17:00",
  "Evening — 17:00 to 20:00",
  "Any time",
];

export default function TechnologyConsultationPage({
  params,
}: ConsultationPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    consultationType: "general",
    preferredDate: "",
    preferredTime: "Any time",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setSuccess(false);
    setError("");

    try {
      const resolvedParams = await params;

      const response = await fetch("/api/customer/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessSlug: resolvedParams.slug,
          category: resolvedParams.category,
          requestType: "Technology Consultation",
          subject:
            formData.subject.trim() ||
            "Technology Consultation Request",
          message: `
Technology Consultation Request

Customer Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}

Consultation Type:
${formData.consultationType}

Preferred Date:
${formData.preferredDate || "Not specified"}

Preferred Time:
${formData.preferredTime}

Customer Message:
${formData.message}
          `.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "We could not send your consultation request."
        );
      }

      setSuccess(true);

      setFormData({
        name: "",
        phone: "",
        email: "",
        consultationType: "general",
        preferredDate: "",
        preferredTime: "Any time",
        subject: "",
        message: "",
      });
    } catch (err) {
      console.error("Technology consultation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while sending your request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#03162F] text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6">
          <Link
            href="/customer/businesses/tech-solutions/technology"
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Technology
          </Link>

          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                <Sparkles className="h-3.5 w-3.5" />
                Technology Consultation
              </div>

              <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                Let's find the right technology solution for you.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Tell Alessandro Tech Solutions what you need help with.
                Our team can review your requirements and guide you toward
                the right technology solution.
              </p>
            </div>

            <div className="hidden h-28 w-28 items-center justify-center rounded-[30px] border border-[#D4AF37]/30 bg-white/10 shadow-2xl md:flex">
              <Sparkles className="h-12 w-12 text-[#D4AF37]" />
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* CUSTOMER INFORMATION */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
                  <UserRound className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="text-base font-black text-[#03162F]">
                    Your Details
                  </h2>
                  <p className="text-xs text-slate-500">
                    How can we contact you?
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <Field
                label="Full Name"
                required
                value={formData.name}
                onChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    name: value,
                  }))
                }
                placeholder="Enter your full name"
              />

              <Field
                label="Phone Number"
                required
                value={formData.phone}
                onChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    phone: value,
                  }))
                }
                placeholder="+260..."
                type="tel"
              />

              <Field
                label="Email Address"
                value={formData.email}
                onChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    email: value,
                  }))
                }
                placeholder="you@example.com"
                type="email"
              />

              <Field
                label="Subject"
                value={formData.subject}
                onChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    subject: value,
                  }))
                }
                placeholder="What would you like to discuss?"
              />
            </div>
          </section>

          {/* CONSULTATION TYPE */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
                  <Wrench className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="text-base font-black text-[#03162F]">
                    What do you need help with?
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select the consultation area that best matches your needs.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
              {consultationTypes.map((type) => {
                const Icon = type.icon;
                const selected =
                  formData.consultationType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        consultationType: type.value,
                      }))
                    }
                    className={`group rounded-2xl border p-4 text-left transition-all duration-200 ${
                      selected
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_8px_25px_rgba(212,175,55,0.12)]"
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#03162F]/20 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-[#03162F] text-[#D4AF37]"
                          : "bg-slate-100 text-[#03162F]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <p className="text-sm font-black text-[#03162F]">
                      {type.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* APPOINTMENT PREFERENCE */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
                  <CalendarDays className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="text-base font-black text-[#03162F]">
                    Preferred Consultation Time
                  </h2>
                  <p className="text-xs text-slate-500">
                    Give us an idea of when you would prefer to speak with us.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <label
                  htmlFor="preferredDate"
                  className="mb-2 block text-xs font-black text-slate-700"
                >
                  Preferred Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        preferredDate: event.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="preferredTime"
                  className="mb-2 block text-xs font-black text-slate-700"
                >
                  Preferred Time
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    id="preferredTime"
                    value={formData.preferredTime}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        preferredTime: event.target.value,
                      }))
                    }
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
                  >
                    {preferredTimes.map((time) => (
                      <option key={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* MESSAGE */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
                  <MessageSquare className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="text-base font-black text-[#03162F]">
                    Tell Us More
                  </h2>
                  <p className="text-xs text-slate-500">
                    Explain what you would like us to help you with.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <textarea
                required
                value={formData.message}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                rows={7}
                placeholder="Describe your technology needs, current problem, project or idea..."
                className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
              />
            </div>
          </section>

          {/* SUCCESS */}
          {success && (
            <div className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="text-sm font-black">
                  Consultation request sent successfully.
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Your request has been sent to Alessandro Tech Solutions.
                  Our team will review it and contact you.
                </p>
              </div>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <div className="rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#03162F] via-[#06264d] to-[#03162F] p-5 shadow-xl sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-sm font-black">
                    Ready to discuss your technology needs?
                  </p>
                </div>

                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-300">
                  Submit your request and our team will review the details
                  before contacting you.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-6 text-sm font-black text-[#03162F] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e4c45a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Consultation Request
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10"
      />
    </div>
  );
}