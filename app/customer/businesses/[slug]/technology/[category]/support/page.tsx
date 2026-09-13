
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Laptop,
  MessageCircle,
  Network,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";

export const dynamic = "force-dynamic";

const supportAreas = [
  {
    icon: Laptop,
    title: "Computer & Laptop Support",
    description:
      "Get help with slow computers, software problems, setup issues, operating-system problems and everyday technical difficulties.",
  },
  {
    icon: Wrench,
    title: "Troubleshooting & Repairs",
    description:
      "We help identify technical problems and recommend the right repair or maintenance solution.",
  },
  {
    icon: ShieldCheck,
    title: "Software & Security",
    description:
      "Installation, configuration, updates and practical guidance to keep your devices reliable and protected.",
  },
  {
    icon: Network,
    title: "Networking & Connectivity",
    description:
      "Support for Wi-Fi, connectivity, basic networking and device connection problems.",
  },
];

const benefits = [
  "Professional technical guidance",
  "Clear explanation of the problem",
  "Practical solutions for your device",
  "Support for individuals and businesses",
  "Transparent service process",
  "Customer-focused assistance",
];

export default async function ITSupportPage({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}) {
  const { slug } = await params;

  const businessSlug = slug || "tech-solutions";

  return (
    <div className="min-h-screen bg-[#061426] text-white">
      <CustomerNavigation />

      <main className="pb-28">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(212,175,55,0.18),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(37,99,235,0.20),transparent_30%),linear-gradient(135deg,#061426,#0b1d35_55%,#07111f)]" />

          <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-14">
            <Link
              href={`/customer/businesses/${businessSlug}/technology`}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition hover:border-[#d4af37]/40 hover:text-[#d4af37]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tech Solutions
            </Link>

            <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f0d477]">
                  <Sparkles className="h-4 w-4" />
                  Alessandro Tech Solutions
                </div>

                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  IT Support
                  <span className="block bg-gradient-to-r from-white via-white to-[#d4af37] bg-clip-text text-transparent">
                    when technology gets difficult.
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Get practical technical assistance for computers, laptops,
                  software, connectivity and everyday technology problems.
                  Tell us what is happening and we will help you find the
                  right solution.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/customer/businesses/${businessSlug}/technology/it-support/support/request`}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f0d477] px-6 py-3.5 font-bold text-[#061426] shadow-lg shadow-[#d4af37]/10 transition hover:-translate-y-0.5"
                  >
                    Request IT Support
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>

                  <a
                    href="#support-areas"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-6 py-3.5 font-semibold text-white backdrop-blur transition hover:border-[#d4af37]/40 hover:bg-white/[0.08]"
                  >
                    Explore Support
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Professional support
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2">
                    <Clock3 className="h-4 w-4 text-[#d4af37]" />
                    Convenient assistance
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2">
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                    Customer focused
                  </span>
                </div>
              </div>

              {/* HERO VISUAL */}
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#d4af37]/20 via-blue-500/10 to-transparent blur-2xl" />

                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur">
                  <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-[#0b1d35] to-[#122744] p-7">
                    <div className="flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4af37]/15 text-[#f0d477]">
                        <Laptop className="h-7 w-7" />
                      </div>

                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Support Available
                      </span>
                    </div>

                    <h2 className="mt-8 text-2xl font-bold">
                      What's happening with your device?
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Start with a simple support request. Give us the details
                      and our team can guide you toward the right service.
                    </p>

                    <div className="mt-7 space-y-3">
                      {[
                        "Computer or laptop problem",
                        "Software or setup issue",
                        "Internet or connectivity problem",
                        "General technical assistance",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d4af37]" />
                          <span className="text-sm text-slate-200">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUPPORT AREAS */}
        <section
          id="support-areas"
          className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              What we can help with
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Technical help without the confusion.
            </h2>

            <p className="mt-4 text-slate-400">
              Choose the area that best describes what you need. We can help
              you identify the problem and determine the next step.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {supportAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article
                  key={area.title}
                  className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/30 hover:bg-white/[0.07]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-blue-500/10 text-[#f0d477] transition group-hover:scale-105">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold">{area.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {area.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* PROCESS */}
        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                  Simple process
                </p>

                <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                  Get support in a few simple steps.
                </h2>

                <p className="mt-4 leading-7 text-slate-400">
                  You don't need to know exactly what is wrong. Give us the
                  information you have and we can help determine what should
                  happen next.
                </p>

                <Link
                  href={`/customer/businesses/${businessSlug}/technology/it-support/support/request`}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 px-5 py-3 font-semibold text-[#f0d477] transition hover:bg-[#d4af37]/15"
                >
                  Start a support request
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    number: "01",
                    title: "Tell us",
                    text: "Describe your device and the problem you're experiencing.",
                  },
                  {
                    number: "02",
                    title: "We review",
                    text: "Your request helps us understand the right support path.",
                  },
                  {
                    number: "03",
                    title: "Get help",
                    text: "We guide you toward the appropriate technical solution.",
                  },
                ].map((step) => (
                  <div
                    key={step.number}
                    className="rounded-2xl border border-white/10 bg-[#08182b] p-5"
                  >
                    <span className="text-sm font-black text-[#d4af37]">
                      {step.number}
                    </span>

                    <h3 className="mt-6 font-bold">{step.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WHY US */}
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                Why Alessandro
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Technology support built around the customer.
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-slate-400">
                Our goal is not simply to fix a device. We want customers to
                understand the solution and feel confident using their
                technology again.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
                    <span className="text-sm text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#d4af37]/15 bg-gradient-to-br from-[#0d223c] to-[#081426] p-7 shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#f0d477]">
                <MessageCircle className="h-6 w-6" />
              </div>

              <h3 className="mt-6 text-2xl font-bold">
                Not sure which support you need?
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                That's okay. Start a support request and explain the situation
                in your own words. We can help direct you to the appropriate
                Tech Solutions service.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/customer/businesses/${businessSlug}/technology/it-support/support/request`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 font-bold text-[#061426] transition hover:bg-[#f0d477]"
                >
                  Get Support
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="tel:+260573383949"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  <Phone className="h-4 w-4" />
                  Call us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#d4af37]/20 bg-gradient-to-r from-[#102743] via-[#0b1e35] to-[#101d31] p-7 sm:p-10">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#d4af37]/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                  Alessandro Tech Solutions
                </p>

                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  Ready to solve your technology problem?
                </h2>

                <p className="mt-2 max-w-xl text-sm text-slate-400">
                  Start your IT support request and tell us what you need.
                </p>
              </div>

              <Link
                href={`/customer/businesses/${businessSlug}/technology/it-support/support/request`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f0d477] px-6 py-3.5 font-bold text-[#061426] shadow-lg transition hover:-translate-y-0.5"
              >
                Request Support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
