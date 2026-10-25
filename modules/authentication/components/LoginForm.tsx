"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const logoPath = "/brand/alessandro-enterprises-logo.png";

function EnterpriseLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
          : "flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
      }
    >
      <Image
        src={logoPath}
        alt="Alessandro Enterprises"
        width={256}
        height={256}
        priority
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#F3F6FA] lg:grid lg:grid-cols-[minmax(360px,0.9fr)_minmax(560px,1.1fr)]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#03162F] px-10 py-10 text-white lg:flex xl:px-16">
        <div className="pointer-events-none absolute -right-48 -top-36 h-[34rem] w-[34rem] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute -right-24 -top-12 h-[25rem] w-[25rem] rounded-full border border-[#D4AF37]/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-[#0A2852]/80 blur-3xl" />
        <div className="pointer-events-none absolute bottom-24 right-14 h-64 w-64 rounded-full bg-[#D4AF37]/[0.07] blur-3xl" />

        <div className="relative z-10 flex items-center gap-4">
          <EnterpriseLogo />
          <div>
            <p className="text-lg font-black tracking-[0.16em] text-white">
              ALESSANDRO
            </p>
            <p className="mt-0.5 text-xs font-bold tracking-[0.31em] text-[#D4AF37]">
              ENTERPRISES
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl py-16">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-blue-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
            ENTERPRISE OPERATIONS PORTAL
          </div>
          <h1 className="max-w-lg text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
            Welcome to a more connected way to work.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-blue-100/75">
            Access the tools and information you need to keep Alessandro
            Enterprises moving.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "One connected workspace",
              "Role-based secure access",
              "Live operational updates",
              "Clear team accountability",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-blue-50/90">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[#E6C34D]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-blue-100/50">
          <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
          Secure access for authorized enterprise personnel
        </div>
      </section>

      <section className="flex min-h-screen flex-col bg-[#F3F6FA]">
        <div className="flex items-center gap-3 bg-[#03162F] px-5 py-4 text-white lg:hidden">
          <EnterpriseLogo compact />
          <div>
            <p className="text-sm font-black tracking-[0.13em]">ALESSANDRO</p>
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#D4AF37]">
              ENTERPRISES
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[470px]">
            <div className="mb-8 hidden items-center gap-3 lg:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#03162F] shadow-sm ring-1 ring-slate-200">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Authorized access
              </span>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-7 shadow-[0_24px_70px_-35px_rgba(3,22,47,0.28)] sm:p-10">
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A17B14]">
                  Alessandro Enterprises
                </p>
                <h2 className="mt-3 text-[2rem] font-bold leading-tight tracking-tight text-[#03162F] sm:text-4xl">
                  Sign in
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Welcome to your enterprise workspace. Enter your account
                  details to continue.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#C9A227] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#C9A227] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 text-sm font-semibold text-white shadow-lg shadow-[#03162F]/15 transition hover:bg-[#0A2852] focus:outline-none focus:ring-4 focus:ring-[#03162F]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign in to AEOS"}
                  {!loading && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </form>

              <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Your connection is protected
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © 2026 Alessandro Enterprises
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
