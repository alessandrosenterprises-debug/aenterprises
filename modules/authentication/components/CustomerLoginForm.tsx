"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";

export default function CustomerLoginForm() {
  const router = useRouter();

  const {
    signInAsCustomer,
    loading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    const result = await signInAsCustomer(
      email,
      password
    );

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (!result.data?.user) {
      setError(
        "Unable to sign in. Please try again."
      );
      return;
    }

    /*
     * Customer login ALWAYS goes to the
     * Customer Portal.
     */
    router.replace("/customer");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
            <img
              src="https://acyitsvfbmeoziwpaysk.supabase.co/storage/v1/object/public/enterprise-images/catalog/494a6ad7-696b-4b91-8cab-b4feae5007e7.png"
              alt="Alessandro Enterprises"
              className="h-full w-full object-contain p-2"
            />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">
            Alessandro Enterprises
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Customer Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white p-7 shadow-2xl sm:p-9">

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-[#03162F]">
              Welcome back
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign in to access your customer account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Email */}
            <div>
              <label
                htmlFor="customer-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="customer-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="customer-password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#03162F] transition hover:text-[#D4AF37]"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Lock
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="customer-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] py-3.5 font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Registration */}
          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have a customer account?
            </p>

            <Link
              href="/customer/register"
              className="mt-2 inline-block font-semibold text-[#03162F] transition hover:text-[#D4AF37]"
            >
              Create Customer Account
            </Link>
          </div>
        </div>

        <p className="mt-7 text-center text-xs text-slate-400">
          © 2026 Alessandro Enterprises
        </p>
      </div>
    </div>
  );
}