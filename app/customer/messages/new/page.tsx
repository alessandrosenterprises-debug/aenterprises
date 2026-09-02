"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  Send,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { supabase } from "@/lib/supabase/client";

interface Business {
  id: string;
  name: string;
}

export default function NewCustomerMessagePage() {
  const router = useRouter();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadBusinesses() {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("active", true)
          .order("name");

        if (error) {
          console.error("Business loading error:", error);
          toast.error("Unable to load businesses.");
          return;
        }

        setBusinesses(data ?? []);
      } finally {
        setLoading(false);
      }
    }

    void loadBusinesses();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject.");
      return;
    }

    if (!body.trim()) {
      toast.error("Please enter your message.");
      return;
    }

    setSending(true);

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

      const {
        data: customer,
        error: customerError,
      } = await supabase
        .from("customers")
        .select(
          "id, full_name, email, phone, is_active, status"
        )
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (customerError) {
        console.error(
          "Customer lookup error:",
          customerError
        );

        toast.error(
          "Unable to verify your customer account."
        );

        return;
      }

      if (!customer) {
        toast.error(
          "Your customer account could not be found."
        );

        return;
      }

      if (
        customer.is_active !== true ||
        customer.status?.toLowerCase() !== "active"
      ) {
        toast.error(
          "Your customer account is currently inactive."
        );

        return;
      }

      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          business_id: businessId || null,
          customer_id: customer.id,

          sender_name:
            customer.full_name ||
            user.user_metadata?.full_name ||
            user.email ||
            "Customer",

          sender_email:
            customer.email ||
            user.email ||
            null,

          sender_phone:
            customer.phone || null,

          subject: subject.trim(),
          body: body.trim(),

          source: "Customer Portal",
          status: "Unread",
          priority: "Normal",

          parent_message_id: null,
          assigned_to: null,
        });

      if (messageError) {
        console.error(
          "Customer message error:",
          messageError
        );

        toast.error(
          messageError.message ||
            "Unable to send your message."
        );

        return;
      }

      toast.success("Message sent successfully.");

      router.push("/customer/messages");
      router.refresh();
    } catch (error) {
      console.error(
        "Customer message submission error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send your message."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      <section className="bg-[#03162F] px-4 pb-8 pt-6 text-white sm:px-5">
        <div className="mx-auto w-full max-w-[720px]">
          <Link
            href="/customer/messages"
            className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-300 transition hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Messages
          </Link>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Customer Area
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-4xl">
            New Message
          </h1>

          <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-base">
            Send a message directly to Alessandro
            Enterprises.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[720px] px-4 py-7 sm:px-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <label
              htmlFor="business"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Business
            </label>

            <div className="relative">
              <Store className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                id="business"
                value={businessId}
                onChange={(event) =>
                  setBusinessId(event.target.value)
                }
                disabled={loading || sending}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:bg-slate-50"
              >
                <option value="">
                  Alessandro Enterprises
                </option>

                {businesses.map((business) => (
                  <option
                    key={business.id}
                    value={business.id}
                  >
                    {business.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-1.5 text-[11px] text-slate-400">
              Select a specific business if your message
              is related to one.
            </p>
          </div>

          <div className="mt-5">
            <label
              htmlFor="subject"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Subject
            </label>

            <input
              id="subject"
              type="text"
              required
              value={subject}
              onChange={(event) =>
                setSubject(event.target.value)
              }
              disabled={sending}
              placeholder="What would you like to discuss?"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:bg-slate-50"
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="message"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Message
            </label>

            <textarea
              id="message"
              required
              rows={8}
              value={body}
              onChange={(event) =>
                setBody(event.target.value)
              }
              disabled={sending}
              placeholder="Write your message here..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:bg-slate-50"
            />

            <p className="mt-1.5 text-right text-[11px] text-slate-400">
              {body.length} characters
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
            <p className="text-xs font-bold text-[#03162F]">
              What happens after you send?
            </p>

            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Your message will appear in the AEOS Messages
              area. When the Alessandro Enterprises team
              replies, the response will appear in your
              customer conversation.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/customer/messages"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                sending ||
                !subject.trim() ||
                !body.trim()
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />

              {sending
                ? "Sending..."
                : "Send Message"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}