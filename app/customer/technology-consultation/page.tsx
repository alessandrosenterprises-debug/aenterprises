"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
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
  Zap,
} from "lucide-react";

interface ConsultationPageProps {
  params?: Promise<{
    slug?: string;
    category?: string;
  }>;
}

const consultationTypes = [
  {
    value: "general",
    label: "General Consultation",
    shortLabel: "General",
    description: "Explore your technology needs and the right solution.",
    icon: Sparkles,
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
  },
  {
    value: "business",
    label: "Business Technology",
    shortLabel: "Business",
    description: "Digital systems, planning and technology strategy.",
    icon: Network,
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
  },
  {
    value: "computer",
    label: "Computer & Laptop",
    shortLabel: "Computers",
    description: "Devices, upgrades, setup and technical advice.",
    icon: Laptop,
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
  },
  {
    value: "software",
    label: "Software & Security",
    shortLabel: "Security",
    description: "Software, cybersecurity, licensing and protection.",
    icon: ShieldCheck,
    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
  },
  {
    value: "networking",
    label: "Networking & Connectivity",
    shortLabel: "Networking",
    description: "Wi-Fi, internet, networking and connectivity.",
    icon: Network,
    gradient: "from-pink-500/20 via-rose-500/10 to-transparent",
  },
];

const preferredTimes = [
  "Morning — 08:00 to 12:00",
  "Afternoon — 12:00 to 17:00",
  "Evening — 17:00 to 20:00",
  "Any time",
];

const initialForm = {
  name: "",
  phone: "",
  email: "",
  consultationType: "general",
  preferredDate: "",
  preferredTime: "Any time",
  subject: "",
  message: "",
};

export default function TechnologyConsultationPage({
  params,
}: ConsultationPageProps) {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const selectedType =
    consultationTypes.find(
      (item) => item.value === formData.consultationType
    ) ?? consultationTypes[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setSuccess(false);
    setError("");

    try {
      if (params) {
        const resolvedParams = await params;
        void resolvedParams;
      }

      const response = await fetch(
        "/api/customer/technology-consultation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            consultationType: formData.consultationType,
            preferredDate: formData.preferredDate,
            preferredTime: formData.preferredTime,
            subject:
              formData.subject.trim() ||
              "Technology Consultation Request",
            message: formData.message.trim(),
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "We could not send your consultation request."
        );
      }

      setSuccess(true);
      setFormData(initialForm);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
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
    <main className="min-h-screen overflow-hidden bg-[#f5f7fb] pb-28 text-slate-900">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#03162F]">
        {/* animated ambient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(212,175,55,0.16),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.20),transparent_30%),radial-gradient(circle_at_70%_90%,rgba(14,165,233,0.14),transparent_30%)]" />

        <div className="absolute -left-32 top-24 h-72 w-72 animate-pulse rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute -right-32 top-0 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-3xl [animation-delay:700ms]" />

        {/* decorative lines */}
        <div className="absolute right-[12%] top-20 hidden h-48 w-48 rotate-12 rounded-[40px] border border-white/10 md:block" />
        <div className="absolute right-[10%] top-28 hidden h-48 w-48 rotate-12 rounded-[40px] border border-[#D4AF37]/10 md:block" />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
          {/* top navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/customer/businesses/tech-solutions/technology"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-bold text-white/90 backdrop-blur-md transition-all duration-300 hover:-translate-x-1 hover:border-[#D4AF37]/40 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Technology
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#D4AF37] sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D4AF37]" />
              AEOS Connected
            </div>
          </div>

          {/* hero content */}
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1fr_360px]">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.08)]">
                <Sparkles className="h-3.5 w-3.5" />
                Alessandro Tech Solutions
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[58px]">
                Let&apos;s build the
                <span className="block bg-gradient-to-r from-[#D4AF37] via-[#f5d978] to-white bg-clip-text text-transparent">
                  right technology solution.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Tell us what you&apos;re trying to solve, improve or build.
                Our technology team will review your requirements and help
                you choose the right path forward.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                  Secure request
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md">
                  <Zap className="h-4 w-4 text-cyan-300" />
                  Expert guidance
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md">
                  <MessageSquare className="h-4 w-4 text-emerald-300" />
                  Direct consultation
                </div>
              </div>
            </div>

            {/* floating visual */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 rounded-[38px] bg-[#D4AF37]/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#D4AF37]/10 blur-2xl" />

                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#9f7b13] text-[#03162F] shadow-lg shadow-[#D4AF37]/20">
                      <Sparkles className="h-6 w-6" />
                    </div>

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                      Available
                    </span>
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Consultation
                  </p>

                  <p className="mt-2 text-2xl font-black text-white">
                    Your technology,
                    <br />
                    our expertise.
                  </p>

                  <div className="mt-7 space-y-3">
                    {[
                      "Understand your needs",
                      "Review possible solutions",
                      "Recommend next steps",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/10 px-3 py-2.5"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[10px] font-black text-[#D4AF37]">
                          {index + 1}
                        </span>

                        <span className="text-xs font-semibold text-slate-300">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* progress */}
          <div className="mt-10 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#f5d978]" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Consultation request
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          SUCCESS BANNER
      ====================================================== */}
      {success && (
        <section className="relative z-10 mx-auto -mt-5 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-5 shadow-xl shadow-emerald-900/5">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-100 blur-3xl" />

            <div className="relative flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-black text-[#03162F]">
                  Consultation request submitted successfully.
                </p>

                <p className="mt-1 text-xs leading-6 text-slate-500">
                  Your request is now registered with Alessandro Tech
                  Solutions. Our team will review it and contact you.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          FORM
      ====================================================== */}
      <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
            {/* MAIN FORM */}
            <div className="space-y-6">
              {/* YOUR DETAILS */}
              <FormSection
                number="01"
                icon={UserRound}
                title="Tell us about you"
                description="We need a few details so our team knows who to contact."
              >
                <div className="grid gap-4 sm:grid-cols-2">
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
                    placeholder="Your full name"
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
                    placeholder="+260 ..."
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
              </FormSection>

              {/* CONSULTATION TYPE */}
              <FormSection
                number="02"
                icon={Wrench}
                title="What can we help with?"
                description="Choose the area closest to what you need."
              >
                <div className="grid gap-3 sm:grid-cols-2">
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
                        className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                          selected
                            ? "border-[#D4AF37] bg-[#03162F] shadow-xl shadow-[#03162F]/10"
                            : "border-slate-200 bg-white hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                        }`}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 transition-opacity duration-300 ${
                            selected
                              ? "opacity-100"
                              : "group-hover:opacity-100"
                          }`}
                        />

                        <div className="relative flex items-start gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                              selected
                                ? "bg-[#D4AF37] text-[#03162F] shadow-lg shadow-[#D4AF37]/20"
                                : "bg-slate-100 text-[#03162F] group-hover:bg-[#03162F] group-hover:text-[#D4AF37]"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`text-sm font-black ${
                                  selected
                                    ? "text-white"
                                    : "text-[#03162F]"
                                }`}
                              >
                                <span className="hidden sm:inline">
                                  {type.label}
                                </span>
                                <span className="sm:hidden">
                                  {type.shortLabel}
                                </span>
                              </p>

                              {selected && (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-[#03162F]">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </div>

                            <p
                              className={`mt-1 text-xs leading-5 ${
                                selected
                                  ? "text-slate-300"
                                  : "text-slate-500"
                              }`}
                            >
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* selected indicator */}
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#D4AF37]" />
                  <span className="text-[11px] font-semibold text-slate-500">
                    Selected:
                  </span>
                  <span className="text-[11px] font-black text-[#03162F]">
                    {selectedType.label}
                  </span>
                </div>
              </FormSection>

              {/* DATE & TIME */}
              <FormSection
                number="03"
                icon={CalendarDays}
                title="When would you prefer?"
                description="This helps our team plan the best time to contact you."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="preferredDate"
                      className="mb-2 block text-xs font-black text-slate-700"
                    >
                      Preferred Date
                    </label>

                    <div className="group relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#D4AF37]" />

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
                        min={new Date()
                          .toISOString()
                          .split("T")[0]}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 hover:bg-white focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
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

                    <div className="group relative">
                      <Clock3 className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#D4AF37]" />

                      <select
                        id="preferredTime"
                        value={formData.preferredTime}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            preferredTime: event.target.value,
                          }))
                        }
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 hover:bg-white focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
                      >
                        {preferredTimes.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* MESSAGE */}
              <FormSection
                number="04"
                icon={MessageSquare}
                title="Tell us what you need"
                description="The more context you provide, the better we can prepare."
              >
                <textarea
                  required
                  value={formData.message}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  rows={6}
                  placeholder="Describe your technology problem, project, idea or requirements..."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 hover:bg-white focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold text-slate-400">
                    Your information is handled through AEOS.
                  </p>

                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secure
                  </span>
                </div>
              </FormSection>

              {/* ERROR */}
              {error && (
                <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-red-200/40 blur-2xl" />

                  <div className="relative flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <MessageSquare className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-black text-red-800">
                        We couldn&apos;t submit your request
                      </p>

                      <p className="mt-1 text-xs leading-5 text-red-600">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBMIT */}
              <div className="relative overflow-hidden rounded-[28px] bg-[#03162F] p-5 shadow-2xl shadow-[#03162F]/15 sm:p-7">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D4AF37]/15 blur-3xl" />
                <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                        <Sparkles className="h-4 w-4" />
                      </div>

                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                        Ready when you are
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white">
                      Send your consultation request
                    </h3>

                    <p className="mt-1 max-w-lg text-xs leading-5 text-slate-400">
                      Our team will review your request and get in touch
                      using the contact details you provided.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="group inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#f0cf63] px-6 py-3.5 text-sm font-black text-[#03162F] shadow-xl shadow-[#D4AF37]/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#D4AF37]/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Request
                        <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* SIDE PANEL */}
            <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="relative overflow-hidden bg-gradient-to-br from-[#03162F] to-[#082b55] p-5">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#D4AF37]/15 blur-2xl" />

                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]">
                      <Sparkles className="h-5 w-5" />
                    </div>

                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                      Your consultation
                    </p>

                    <h3 className="mt-2 text-lg font-black text-white">
                      A clearer path starts here.
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-slate-300">
                      Give our team the information we need and we&apos;ll
                      help turn your technology challenge into a practical
                      next step.
                    </p>
                  </div>
                </div>

                <div className="p-4">
                  {[
                    {
                      icon: UserRound,
                      title: "Your details",
                      text: "Contact information",
                    },
                    {
                      icon: Wrench,
                      title: "Your needs",
                      text: selectedType.label,
                    },
                    {
                      icon: CalendarDays,
                      title: "Your preference",
                      text:
                        formData.preferredDate ||
                        "Date not specified",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-0"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {item.title}
                          </p>

                          <p className="mt-0.5 truncate text-xs font-bold text-slate-700">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* why consult */}
              <div className="rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#fffdf5] to-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#9a7614]">
                    <Zap className="h-4 w-4" />
                  </div>

                  <h3 className="text-sm font-black text-[#03162F]">
                    Why consult us?
                  </h3>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    "Understand the problem",
                    "Explore practical solutions",
                    "Plan your next step",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-600"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* mini CTA */}
              <Link
                href="/customer/businesses/tech-solutions/technology"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-md"
              >
                <div>
                  <p className="text-xs font-black text-[#03162F]">
                    Explore Tech Solutions
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    View our technology services
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#D4AF37]" />
              </Link>
            </aside>
          </div>
        </form>
      </section>
    </main>
  );
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  number,
  icon: Icon,
  title,
  description,
  children,
}: {
  number: string;
  icon: typeof UserRound;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37] shadow-lg shadow-[#03162F]/10">
            <Icon className="h-5 w-5" />

            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#D4AF37] text-[8px] font-black text-[#03162F]">
              {number}
            </span>
          </div>

          <div>
            <h2 className="text-base font-black text-[#03162F]">
              {title}
            </h2>

            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

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
          <span className="ml-1 text-[#D4AF37]">*</span>
        )}
      </label>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 hover:bg-white focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
      />
    </div>
  );
}