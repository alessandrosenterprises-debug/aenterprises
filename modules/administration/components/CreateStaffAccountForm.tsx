"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { inviteStaffAccount } from "@/app/dashboard/administration/access-actions";
import type { AccessRole } from "../services/access-control.service";

export default function CreateStaffAccountForm({ roles, viewerRoleName }: { roles: AccessRole[]; viewerRoleName: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [pending, startTransition] = useTransition();
  const isSuperAdmin = viewerRoleName === "Super Administrator";
  const availableRoles = roles.filter((role) => role.status === "Active" && role.name !== "Customer" && (isSuperAdmin || role.name !== "Super Administrator" && role.name !== "Enterprise Manager"));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await inviteStaffAccount({ fullName, email, roleId });
        toast.success(`Invitation sent to ${result.email}. They can set their password from the email link.`);
        setFullName("");
        setEmail("");
        setRoleId("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create this staff account.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]"><UserPlus className="h-5 w-5" /></span>
        <div><h2 className="font-bold text-[#03162F]">Add staff account</h2><p className="text-xs text-slate-500">Assign a role and send a secure password setup invitation.</p></div>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_220px_auto]">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Full name<input required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Staff member name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Work email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@company.com" className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Staff role<select required value={roleId} onChange={(event) => setRoleId(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]"><option value="">Choose a role</option>{availableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
        <button type="submit" disabled={pending || availableRoles.length === 0} className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#03162F] px-4 text-sm font-bold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-50"><UserPlus className="h-4 w-4" />{pending ? "Sending invite…" : "Create staff login"}</button>
      </form>
      <p className="mt-3 text-xs leading-5 text-slate-500">No shared passwords are created. The staff member receives a one-time email link to set their own password.</p>
    </section>
  );
}
