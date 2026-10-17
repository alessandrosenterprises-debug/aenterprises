"use client";

import { getCustomerErrorMessage } from "@/modules/customers/utils/customer-error";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Headphones,
  Loader2,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { createMessage } from "@/modules/messages/services/message.client";
import { useRouter } from "next/navigation";

export default function RepairPage() {
  const { slug, category } = useParams<{ slug: string; category: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const backHref = `/customer/businesses/${slug}/technology/${category}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/customer/login");
        throw new Error("Your session has expired. Please sign in again.");
      }

      const [businessResult, customerResult] = await Promise.all([
        supabase.from("businesses").select("id, name").eq("slug", slug).eq("active", true).maybeSingle(),
        supabase.from("customers").select("id, full_name, email, phone, is_active, status").eq("auth_user_id", user.id).maybeSingle(),
      ]);

      if (businessResult.error || !businessResult.data) {
        throw new Error("We couldn’t find this business. Please refresh and try again.");
      }
      if (customerResult.error || !customerResult.data) {
        throw new Error("Your customer account could not be verified. Please sign in again.");
      }
      const customer = customerResult.data;
      if (customer.is_active !== true || customer.status?.toLowerCase() !== "active") {
        throw new Error("Your customer account is currently inactive.");
      }

      await createMessage({
        business_id: businessResult.data.id,
        customer_id: customer.id,
        sender_name: customer.full_name?.trim() || user.user_metadata?.full_name || user.email || "Customer",
        sender_email: customer.email?.trim() || user.email || null,
        sender_phone: customer.phone?.trim() || null,
        subject: `Repair Request - ${form.get("device")}`,
        body: `${message}\n\nCategory: ${category}`,
        source: "Customer Portal — Repair Request",
        status: "Unread",
        priority: "Normal",
        parent_message_id: null,
        assigned_to: null,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      setErrorMessage(getCustomerErrorMessage(error, "We couldn’t send your request. Please check your connection and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-[#03162F]">


      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] bg-[#03162F] shadow-lg">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/15 blur-3xl" />
          <div className="relative grid gap-7 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                <Wrench className="h-4 w-4" /> Alessandro Tech Solutions
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">Repair &amp; Maintenance</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Tell us what’s happening with your device. Our team will review the details and get in touch to discuss the next step.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-200 lg:min-w-64">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F]"><ClipboardCheck className="h-5 w-5" /></div>
              <div><p className="font-bold text-white">Repair assessment</p><p className="mt-1 text-xs text-slate-300">Request a review from our team</p></div>
            </div>
          </div>
        </section>

        {submitted ? (
          <section className="mx-auto mt-7 max-w-2xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Request sent</p>
            <h2 className="mt-2 text-2xl font-black">Your device is in the queue</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">We’ve received your repair details. You can follow up with the Tech Solutions team through your messages.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/customer/messages" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10294a]">View Messages <ArrowRight className="h-4 w-4" /></Link>
              <Link href={backHref} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-[#03162F] transition hover:bg-slate-50">Back to category</Link>
            </div>
          </section>
        ) : (
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="mb-7 border-b border-slate-100 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9b7a08]">Repair intake</p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">Tell us about your device</h2>
                <p className="mt-2 text-sm text-slate-500">Fields marked required help us assess your request.</p>
              </div>

              <div className="space-y-7">
                <FormSection number="01" title="Device details" description="Identify the device you need help with.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Device type" required><select name="device" required className="form-control"><option value="">Select device</option><option>Laptop</option><option>Desktop Computer</option><option>Phone</option><option>Tablet</option><option>Printer</option><option>Other</option></select></Field>
                    <Field label="Brand" required><input name="brand" required className="form-control" placeholder="e.g. HP, Dell, Samsung" /></Field>
                    <Field label="Model"><input name="model" className="form-control" placeholder="Model or product number" /></Field>
                    <Field label="Current condition" required><select name="condition" required className="form-control"><option value="">Select condition</option><option>Working but has a problem</option><option>Slow / unstable</option><option>Not powering on</option><option>Physically damaged</option><option>Water / liquid damage</option><option>Other</option></select></Field>
                  </div>
                </FormSection>

                <FormSection number="02" title="Describe the issue" description="Include what happened and when you first noticed it.">
                  <Field label="What is wrong with the device?" required><textarea name="problem" required minLength={10} rows={5} className="form-control resize-y" placeholder="Describe the symptoms, error messages or damage..." /></Field>
                </FormSection>

                <FormSection number="03" title="How can we reach you?" description="We’ll use these details to respond to your request.">
                  <Field label="Preferred contact" required><input name="contact" required className="form-control" placeholder="Phone, WhatsApp or email" /></Field>
                  <Field label="Additional information"><textarea name="notes" rows={3} className="form-control resize-y" placeholder="Anything else that may help us assess the repair?" /></Field>
                </FormSection>
              </div>

              {errorMessage && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">{errorMessage}</div>}

              <div className="mt-7 border-t border-slate-100 pt-5">
                <button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3.5 text-sm font-black text-[#03162F] shadow-sm transition hover:bg-[#e4c45d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-56">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending request…</> : <>Submit repair request <ArrowRight className="h-4 w-4" /></>}
                </button>
                <p className="mt-3 text-xs text-slate-400">Submitting this form sends a message to the Tech Solutions team.</p>
              </div>
            </form>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="font-black">What happens next?</h2>
                <ol className="mt-5 space-y-5">
                  <Step number="1" title="We review your details" description="Our team checks the symptoms and device information." />
                  <Step number="2" title="We contact you" description="We’ll follow up using your preferred contact method." />
                  <Step number="3" title="Agree on next steps" description="Assessment, timing and any costs are discussed with you." />
                </ol>
              </div>
              <div className="rounded-3xl bg-[#03162F] p-5 text-white shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37]">A few helpful details</p>
                <div className="mt-4 space-y-4 text-sm text-slate-200">
                  <Tip icon={ShieldCheck} text="Keep your passwords private. We’ll ask only if access is needed." />
                  <Tip icon={Clock3} text="A clear description helps us respond with the right next step." />
                  <Tip icon={Headphones} text="You can continue the conversation in Customer Messages." />
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
      <style jsx global>{`
        .form-control { width: 100%; min-height: 46px; border: 1px solid #dbe2ea; border-radius: 12px; background: #fff; padding: 0.72rem 0.85rem; color: #03162f; font-size: 0.875rem; line-height: 1.5; outline: none; transition: border-color 160ms ease, box-shadow 160ms ease; }
        .form-control::placeholder { color: #94a3b8; }
        .form-control:focus { border-color: #d4af37; box-shadow: 0 0 0 3px rgb(212 175 55 / 16%); }
        select.form-control { cursor: pointer; }
      `}</style>
    </div>
  );
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="space-y-4"><div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-xs font-black text-[#8a6b00]">{number}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div><div className="space-y-4 sm:pl-11">{children}</div></section>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}{required && <span className="ml-1 text-[#9b7a08]">*</span>}</span>{children}</label>;
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#03162F] text-xs font-black text-[#D4AF37]">{number}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></li>;
}

function Tip({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return <p className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" /><span className="text-xs leading-5">{text}</span></p>;
}
