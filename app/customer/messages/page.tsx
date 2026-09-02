import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MessageCircle,
  Plus,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerMessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let messageCount = 0;

  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (customer) {
      const { count } = await supabase
        .from("messages")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("customer_id", customer.id);

      messageCount = count ?? 0;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      {/* HEADER */}
      <section className="bg-[#03162F] px-4 pb-9 pt-6 text-white sm:px-5">
        <div className="mx-auto w-full max-w-[720px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Customer Area
              </p>

              <h1 className="mt-2 text-2xl font-bold sm:text-4xl">
                Messages
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-base">
                Communicate directly with Alessandro Enterprises and
                its businesses.
              </p>
            </div>

            {/* NEW MESSAGE */}
            <Link
              href="/customer/messages/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-xs font-bold text-[#03162F] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#e3c45a] hover:shadow-xl active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              New Message
            </Link>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto w-full max-w-[720px] px-4 py-7 sm:px-5">
        {/* MESSAGE SUMMARY */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]">
                <MessageCircle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Conversations
                </p>

                <p className="mt-0.5 text-xl font-black text-[#03162F]">
                  {messageCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F]">
                <Mail className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Support
                </p>

                <p className="mt-0.5 text-sm font-bold text-[#03162F]">
                  Alessandro
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MESSAGE AREA */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-[#03162F]">
              Your Conversations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Messages exchanged with Alessandro Enterprises will
              appear here.
            </p>
          </div>

          {messageCount === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
                <MessageCircle className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#03162F]">
                No messages yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                Start a conversation with Alessandro Enterprises.
                Your messages and replies will remain in the same
                conversation.
              </p>

              <Link
                href="/customer/messages/new"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-xs font-bold text-[#03162F] transition hover:-translate-y-0.5 hover:bg-[#e3c45a]"
              >
                <Plus className="h-4 w-4" />
                Start New Message
              </Link>
            </div>
          ) : (
            <div className="p-5">
              <Link
                href="/customer/messages/new"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#D4AF37] hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]">
                    <MessageCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#03162F]">
                      Continue your conversations
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Open your customer messages
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 text-[#D4AF37]" />
              </Link>
            </div>
          )}
        </div>

        {/* INFORMATION */}
        <div className="mt-5 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />

            <div>
              <p className="text-xs font-bold text-[#03162F]">
                Messages are handled by Alessandro Enterprises
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                When you send a message, it will appear in the AEOS
                Messages area for the appropriate team to respond.
                Replies will appear back here in your customer
                conversation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}