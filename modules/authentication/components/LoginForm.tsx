import { Lock, Mail } from "lucide-react";

export default function LoginForm() {
  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">

      <div className="mb-10 text-center">

        <h1 className="text-4xl font-black text-[#03162F]">
          ALESSANDRO
        </h1>

        <p className="mt-2 text-slate-500">
          Enterprise Operating System
        </p>

      </div>

      <h2 className="mb-8 text-center text-2xl font-bold text-[#03162F]">
        Welcome Back
      </h2>

      <form className="space-y-6">

        <div>
          <label className="mb-2 block font-medium">
            Email Address
          </label>

          <div className="relative">

            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="email"
              placeholder="name@example.com"
              className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none transition focus:border-[#D4AF37]"
            />

          </div>
        </div>

        <div>

          <label className="mb-2 block font-medium">
            Password
          </label>

          <div className="relative">

            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none transition focus:border-[#D4AF37]"
            />

          </div>

        </div>

        <div className="flex items-center justify-between">

          <label className="flex items-center gap-2 text-sm">

            <input type="checkbox" />

            Remember Me

          </label>

          <button
            type="button"
            className="text-sm font-medium text-[#03162F]"
          >
            Forgot Password?
          </button>

        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#03162F] py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          Sign In
        </button>

      </form>

      <p className="mt-10 text-center text-sm text-slate-500">
        © 2026 Alessandro Enterprises
      </p>

    </div>
  );
}