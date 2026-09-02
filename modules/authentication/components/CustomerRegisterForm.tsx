"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CustomerRegisterForm() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/customer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to create your customer account."
        );
        return;
      }

      router.push("/customer/login?registered=true");
      router.refresh();
    } catch {
      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
            <img
              src="https://acyitsvfbmeoziwpaysk.supabase.co/storage/v1/object/public/enterprise-images/catalog/494a6ad7-696b-4b91-8cab-b4feae5007e7.png"
              alt="Alessandro Enterprises"
              className="h-full w-full object-contain p-2"
            />
          </div>

          <h1 className="text-3xl font-black text-white">
            Alessandro Enterprises
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Customer Portal
          </p>
        </div>

        {/* Registration Card */}
        <div className="rounded-3xl bg-white p-7 shadow-2xl sm:p-9">

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-[#03162F]">
              Create your account
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create an Alessandro Enterprises customer account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Names */}
            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="first-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  First Name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="first-name"
                    type="text"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    placeholder="First name"
                    className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="last-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Last Name
                </label>

                <input
                  id="last-name"
                  type="text"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) =>
                    setLastName(e.target.value)
                  }
                  placeholder="Last name"
                  className="w-full rounded-xl border border-slate-200 py-3.5 px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="register-phone"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Phone Number
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="register-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="+260 97 000 0000"
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="register-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Repeat your password"
                  className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
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
                "Creating Account..."
              ) : (
                <>
                  Create Customer Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Login */}
          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have a customer account?
            </p>

            <Link
              href="/customer/login"
              className="mt-2 inline-block font-semibold text-[#03162F] transition hover:text-[#D4AF37]"
            >
              Sign In
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