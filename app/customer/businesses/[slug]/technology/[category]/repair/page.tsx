"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
} from "lucide-react";

export default function RepairPage({
  params,
}: {
  params: { slug: string; category: string };
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const form = new FormData(event.currentTarget);

    const message = `
REPAIR INTAKE REQUEST

Device:
${form.get("device")}

Brand:
${form.get("brand")}

Model:
${form.get("model")}

Problem:
${form.get("problem")}

Device condition:
${form.get("condition")}

Preferred contact:
${form.get("contact")}

Additional information:
${form.get("notes")}
    `.trim();

    try {
      const response = await fetch("/api/customer/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: `Repair Request - ${form.get("device")}`,
          message,
          business_slug: params.slug,
          category: params.category,
        }),
      });

      if (!response.ok) {
        throw new Error("Repair request failed");
      }

      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Unable to submit repair request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24 text-[#03162F]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link
          href={`/customer/businesses/${params.slug}/technology/${params.category}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Repairs & Maintenance
        </Link>

        <section className="mt-5 rounded-3xl bg-gradient-to-br from-[#03162F] to-[#10294a] p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]">
            <ClipboardCheck className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-3xl font-black text-white">
            Repair & Maintenance
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Submit your device details and describe the problem. The
            Alessandro Tech Solutions team can review the repair request
            through AEOS.
          </p>
        </section>

        {submitted ? (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />

            <h2 className="mt-4 text-xl font-black">
              Repair request received
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your device information has been submitted for review.
            </p>

            <Link
              href="/customer/messages"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white"
            >
              View Messages
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Device">
                <select name="device" required className="input">
                  <option value="">Select device</option>
                  <option>Laptop</option>
                  <option>Desktop Computer</option>
                  <option>Phone</option>
                  <option>Tablet</option>
                  <option>Printer</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Brand">
                <input
                  name="brand"
                  required
                  className="input"
                  placeholder="e.g. HP, Dell, Samsung"
                />
              </Field>
            </div>

            <Field label="Model">
              <input
                name="model"
                className="input"
                placeholder="Device model"
              />
            </Field>

            <Field label="What is wrong with the device?">
              <textarea
                name="problem"
                required
                rows={5}
                className="input resize-none"
                placeholder="Describe the problem..."
              />
            </Field>

            <Field label="Current device condition">
              <select name="condition" required className="input">
                <option value="">Select condition</option>
                <option>Working but has a problem</option>
                <option>Slow / unstable</option>
                <option>Not powering on</option>
                <option>Physically damaged</option>
                <option>Water / liquid damage</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Preferred contact">
              <input
                name="contact"
                required
                className="input"
                placeholder="Phone, WhatsApp or email"
              />
            </Field>

            <Field label="Additional information">
              <textarea
                name="notes"
                rows={3}
                className="input resize-none"
                placeholder="Anything else we should know?"
              />
            </Field>

            <button
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3.5 text-sm font-black text-[#03162F] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Submit Repair Request
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>

      {children}

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.8rem 0.9rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.12);
        }
      `}</style>
    </label>
  );
}