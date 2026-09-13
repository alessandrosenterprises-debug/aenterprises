"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Laptop,
  Loader2,
  Mail,
  MessageCircle,
  Network,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { supabase } from "@/lib/supabase/client";
import { createMessage } from "@/modules/messages/services/message.client";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

interface Customer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean | null;
  status: string | null;
}

const issueTypes = [
  {
    value: "Computer & Laptop Support",
    label: "Computer & Laptop",
    description: "Laptop, desktop, performance or operating-system problems",
    icon: Laptop,
  },
  {
    value: "Troubleshooting & Repairs",
    label: "Troubleshooting & Repairs",
    description: "Device problems, diagnostics, faults or repairs",
    icon: Wrench,
  },
  {
    value: "Software & Security",
    label: "Software & Security",
    description: "Software, applications, updates, setup or security",
    icon: ShieldCheck,
  },
  {
    value: "Networking & Connectivity",
    label: "Networking & Connectivity",
    description: "Wi-Fi, internet, router or device connectivity",
    icon: Network,
  },
  {
    value: "General Technical Assistance",
    label: "General Technical Assistance",
    description: "Something technical that does not fit the options above",
    icon: Sparkles,
  },
];

const deviceOptions = [
  "Laptop",
  "Desktop Computer",
  "Phone",
  "Tablet",
  "Printer",
  "Router / Wi-Fi",
  "CCTV / Security Device",
  "Other",
];

const urgencyOptions = [
  {
    value: "Low" as const,
    label: "Low",
    description: "General help or non-urgent issue",
  },
  {
    value: "Normal" as const,
    label: "Normal",
    description: "I need assistance soon",
  },
  {
    value: "High" as const,
    label: "High",
    description: "The issue is affecting my work",
  },
  {
    value: "Urgent" as const,
    label: "Urgent",
    description: "I need assistance as soon as possible",
  },
];

const contactOptions = [
  {
    value: "Phone",
    label: "Phone",
    icon: Phone,
  },
  {
    value: "WhatsApp",
    label: "WhatsApp",
    icon: MessageCircle,
  },
  {
    value: "Email",
    label: "Email",
    icon: Mail,
  },
];

export default function ITSupportRequestPage() {
  const params = useParams<{
    slug: string;
    category: string;
  }>();

  const router = useRouter();

  const slug = params?.slug || "";
  const category = params?.category || "it-support";

  const [business, setBusiness] = useState<Business | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [issueType, setIssueType] = useState(
    "Computer & Laptop Support"
  );
  const [device, setDevice] = useState("");
  const [problem, setProblem] = useState("");
  const [urgency, setUrgency] =
    useState<"Low" | "Normal" | "High" | "Urgent">("Normal");
  const [preferredContact, setPreferredContact] =
    useState("Phone");
  const [additionalDetails, setAdditionalDetails] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          toast.error(
            "Your session has expired. Please sign in again."
          );

          router.push("/customer/login");
          return;
        }

        const [
          businessResult,
          customerResult,
        ] = await Promise.all([
          supabase
            .from("businesses")
            .select(
              "id, name, slug, description, logo_url"
            )
            .eq("slug", slug)
            .eq("active", true)
            .maybeSingle(),

          supabase
            .from("customers")
            .select(
              "id, full_name, email, phone, is_active, status"
            )
            .eq("auth_user_id", user.id)
            .maybeSingle(),
        ]);

        if (businessResult.error) {
          console.error(
            "IT Support business lookup error:",
            businessResult.error
          );

          toast.error(
            "Unable to load Tech Solutions."
          );

          return;
        }

        if (!businessResult.data) {
          toast.error(
            "Tech Solutions business could not be found."
          );

          router.push("/customer/businesses");
          return;
        }

        if (customerResult.error) {
          console.error(
            "IT Support customer lookup error:",
            customerResult.error
          );

          toast.error(
            "Unable to verify your customer account."
          );

          return;
        }

        if (!customerResult.data) {
          toast.error(
            "Your customer account could not be found."
          );

          return;
        }

        if (
          customerResult.data.is_active !== true ||
          customerResult.data.status?.toLowerCase() !==
            "active"
        ) {
          toast.error(
            "Your customer account is currently inactive."
          );

          return;
        }

        setBusiness(businessResult.data);
        setCustomer(customerResult.data);
      } catch (error) {
        console.error(
          "IT Support request loading error:",
          error
        );

        toast.error(
          "Unable to prepare the support request."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [router, slug]);

  const selectedIssue = useMemo(
    () =>
      issueTypes.find(
        (item) => item.value === issueType
      ) ?? issueTypes[0],
    [issueType]
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!business || !customer) {
      toast.error(
        "Your customer information is not ready yet."
      );
      return;
    }

    if (!issueType.trim()) {
      toast.error("Please select an issue type.");
      return;
    }

    if (!device.trim()) {
      toast.error("Please select the affected device.");
      return;
    }

    if (!problem.trim()) {
      toast.error(
        "Please describe the problem you are experiencing."
      );
      return;
    }

    if (!preferredContact.trim()) {
      toast.error(
        "Please select your preferred contact method."
      );
      return;
    }

    setSending(true);

    try {
      const body = [
        `Issue type: ${issueType}`,
        `Device: ${device}`,
        `Urgency: ${urgency}`,
        `Preferred contact: ${preferredContact}`,
        "",
        "Problem description:",
        problem.trim(),
        ...(additionalDetails.trim()
          ? [
              "",
              "Additional details:",
              additionalDetails.trim(),
            ]
          : []),
      ].join("\n");

      await createMessage({
        business_id: business.id,
        customer_id: customer.id,

        sender_name:
          customer.full_name?.trim() ||
          "Customer",

        sender_email:
          customer.email?.trim() || null,

        sender_phone:
          customer.phone?.trim() || null,

        subject: `IT Support Request — ${issueType}`,

        body,

        source: "Customer Portal — IT Support",

        status: "Unread",

        priority: urgency,

        parent_message_id: null,

        assigned_to: null,
      });

      toast.success(
        "Your IT Support request has been sent."
      );

      router.push("/customer/messages");
      router.refresh();
    } catch (error) {
      console.error(
        "IT Support request submission error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send your support request."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#061426] pb-28 text-white">
        <CustomerNavigation />

        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/10">
              <Loader2 className="h-6 w-6 animate-spin text-[#f0d477]" />
            </div>

            <h1 className="mt-5 text-xl font-bold">
              Preparing your support request
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Verifying your customer account and Tech
              Solutions.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#061426] pb-28 text-white">
      <CustomerNavigation />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(212,175,55,0.18),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(37,99,235,0.18),transparent_32%),linear-gradient(135deg,#061426,#0b1d35_55%,#07111f)]" />

        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
          <Link
            href={`/customer/businesses/${slug}/technology/${category}/support`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur transition hover:border-[#d4af37]/40 hover:text-[#f0d477]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to IT Support
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#f0d477]">
                <Sparkles className="h-3.5 w-3.5" />
                Alessandro Tech Solutions
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Request IT Support
                <span className="block bg-gradient-to-r from-white via-white to-[#d4af37] bg-clip-text text-transparent">
                  Tell us what is happening.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                You do not need to know exactly what is wrong.
                Give us the details you have and our team will
                help determine the right solution.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/15 text-[#f0d477]">
                  <MessageCircle className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-bold text-white">
                    Direct to AEOS Messages
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Your request will be reviewed by the
                    Alessandro Enterprises team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_320px]"
        >
          <div className="space-y-6">
            {/* ISSUE TYPE */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d4af37]">
                  Step 01
                </p>

                <h2 className="mt-2 text-xl font-black">
                  What do you need help with?
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Choose the area that best describes your
                  problem.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {issueTypes.map((item) => {
                  const Icon = item.icon;
                  const selected =
                    issueType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setIssueType(item.value)
                      }
                      disabled={sending}
                      className={`group rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                        selected
                          ? "border-[#d4af37]/60 bg-[#d4af37]/10 shadow-lg shadow-[#d4af37]/5"
                          : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-[#d4af37]/20 text-[#f0d477]"
                              : "bg-white/[0.06] text-slate-300"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {item.label}
                            </span>

                            {selected && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d4af37]" />
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* DEVICE */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d4af37]">
                  Step 02
                </p>

                <h2 className="mt-2 text-xl font-black">
                  What device is affected?
                </h2>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="device"
                  className="mb-2 block text-xs font-bold text-slate-300"
                >
                  Device
                </label>

                <select
                  id="device"
                  value={device}
                  onChange={(event) =>
                    setDevice(event.target.value)
                  }
                  disabled={sending}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#08182b] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/10"
                >
                  <option value="">
                    Select a device
                  </option>

                  {deviceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* PROBLEM */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d4af37]">
                  Step 03
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Tell us about the problem
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Explain what is happening in your own words.
                </p>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="problem"
                  className="mb-2 block text-xs font-bold text-slate-300"
                >
                  Problem description
                </label>

                <textarea
                  id="problem"
                  value={problem}
                  onChange={(event) =>
                    setProblem(event.target.value)
                  }
                  disabled={sending}
                  required
                  minLength={10}
                  rows={6}
                  placeholder="For example: My laptop becomes very slow after starting and some applications stop responding..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#08182b] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/10"
                />

                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>
                    Include any error message or unusual
                    behaviour you have noticed.
                  </span>

                  <span className="shrink-0 pl-3">
                    {problem.length}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="additional-details"
                  className="mb-2 block text-xs font-bold text-slate-300"
                >
                  Additional details
                  <span className="ml-1 font-normal text-slate-500">
                    Optional
                  </span>
                </label>

                <textarea
                  id="additional-details"
                  value={additionalDetails}
                  onChange={(event) =>
                    setAdditionalDetails(
                      event.target.value
                    )
                  }
                  disabled={sending}
                  rows={4}
                  placeholder="Anything else that may help our team understand the situation..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#08182b] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/10"
                />
              </div>
            </section>

            {/* URGENCY */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#f0d477]">
                  <Clock3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d4af37]">
                    Step 04
                  </p>

                  <h2 className="mt-2 text-xl font-black">
                    How urgent is it?
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {urgencyOptions.map((option) => {
                  const selected =
                    urgency === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setUrgency(option.value)
                      }
                      disabled={sending}
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-[#d4af37]/60 bg-[#d4af37]/10"
                          : "border-white/10 bg-white/[0.025] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold">
                          {option.label}
                        </span>

                        {selected && (
                          <CheckCircle2 className="h-4 w-4 text-[#d4af37]" />
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* CONTACT */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d4af37]">
                  Step 05
                </p>

                <h2 className="mt-2 text-xl font-black">
                  How should we contact you?
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  We will use the contact information already
                  associated with your customer account.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {contactOptions.map((option) => {
                  const Icon = option.icon;
                  const selected =
                    preferredContact === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setPreferredContact(
                          option.value
                        )
                      }
                      disabled={sending}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-bold transition ${
                        selected
                          ? "border-[#d4af37]/60 bg-[#d4af37]/10 text-[#f0d477]"
                          : "border-white/10 bg-white/[0.025] text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}

                      {selected && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SUBMIT */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href={`/customer/businesses/${slug}/technology/${category}/support`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  sending ||
                  !device.trim() ||
                  !problem.trim()
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f0d477] px-7 py-3 text-sm font-black text-[#061426] shadow-lg shadow-[#d4af37]/10 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Support Request
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-[#d4af37]/20 bg-gradient-to-br from-[#102743] to-[#081426] p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/15 text-[#f0d477]">
                  <selectedIssue.icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d4af37]">
                    Selected support
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-white">
                    {selectedIssue.label}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Device
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-200">
                    {device || "Not selected yet"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Priority
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-200">
                    {urgency}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Contact
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-200">
                    {preferredContact}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                  <AlertCircle className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold">
                    What happens next?
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Your request will appear in the AEOS
                    Messages area for the Alessandro
                    Enterprises team to review.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Any response can continue through your
                    customer messages conversation.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center gap-2 text-[#f0d477]">
                <CheckCircle2 className="h-4 w-4" />

                <span className="text-xs font-bold">
                  Your account details
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-400">
                <p>
                  {customer?.full_name || "Customer"}
                </p>

                {customer?.phone && (
                  <p>{customer.phone}</p>
                )}

                {customer?.email && (
                  <p className="break-all">
                    {customer.email}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}