"use client";

import { useState, useTransition } from "react";
import { useMemo } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { inviteStaffAccount } from "@/app/dashboard/administration/access-actions";
import type { AccessRole } from "../services/access-control.service";

type Option = { id: string; name: string };
type ManagerOption = { id: string; display_name: string | null; email: string; business_id: string | null; branch_id: string | null; department_id: string | null };

export default function CreateStaffAccountForm({ roles, viewerRoleName, businesses, branches, departments, storeManagers, directLoginRoleIds }: { roles: AccessRole[]; viewerRoleName: string; businesses: Option[]; branches: (Option & { business_id: string })[]; departments: Option[]; storeManagers: ManagerOption[]; directLoginRoleIds: string[] }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [storeManagerProfileId, setStoreManagerProfileId] = useState("");
  const [isBranchManager, setIsBranchManager] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmLoginPassword, setConfirmLoginPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const isSuperAdmin = viewerRoleName === "Super Administrator";
  const availableRoles = roles.filter((role) => role.status === "Active" && !["Customer", "Customer Portal User"].includes(role.name) && (isSuperAdmin || role.name !== "Super Administrator" && role.name !== "Enterprise Manager"));
  const availableBranches = useMemo(() => branches.filter((branch) => branch.business_id === businessId), [branches, businessId]);
  const availableManagers = useMemo(() => storeManagers.filter((manager) => manager.business_id === businessId && manager.branch_id === branchId && manager.department_id === departmentId), [storeManagers, businessId, branchId, departmentId]);
  const selectedRole = roles.find((role) => role.id === roleId);
  const canManageBranch = /manager|supervisor/i.test(selectedRole?.name ?? "");
  const canDirectSignIn = Boolean(selectedRole && directLoginRoleIds.includes(selectedRole.id));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!businessId || !branchId || !departmentId) return toast.error("Select a store, branch, and department.");
    if (!isBranchManager && !canDirectSignIn && !storeManagerProfileId) return toast.error("Select the store manager for this staff member.");
    if (!/^\d{4}$/.test(pin)) return toast.error("Choose a four-digit PIN.");
    if (pin !== confirmPin) return toast.error("The PINs do not match.");
    if (canDirectSignIn && loginPassword.length < 10) return toast.error("Department heads need a login password of at least 10 characters.");
    if (canDirectSignIn && loginPassword !== confirmLoginPassword) return toast.error("The login passwords do not match.");
    startTransition(async () => {
      try {
        const result = await inviteStaffAccount({ fullName, email, phone, position, roleId, pin, loginPassword: canDirectSignIn ? loginPassword : "", businessId, branchId, departmentId, storeManagerProfileId: isBranchManager ? null : storeManagerProfileId, isBranchManager });
        toast.success(canDirectSignIn ? `Department login created for ${result.email}. Share the password securely.` : `Staff login created for ${result.email}. Give the PIN to the staff member securely.`);
        setFullName("");
        setEmail("");
        setPhone("");
        setPosition("");
        setRoleId("");
        setPin("");
        setConfirmPin("");
        setLoginPassword(""); setConfirmLoginPassword("");
        setBusinessId(""); setBranchId(""); setDepartmentId(""); setStoreManagerProfileId(""); setIsBranchManager(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create this staff account.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]"><UserPlus className="h-5 w-5" /></span>
        <div><h2 className="font-bold text-[#03162F]">Add staff account</h2><p className="text-xs text-slate-500">Create the staff login and assign its role and four-digit PIN in AEOS.</p></div>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Full name<input required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Staff member name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Work email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@company.com" className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Phone<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+260…" className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Job title<input required value={position} onChange={(event) => setPosition(event.target.value)} placeholder="e.g. Cashier, Rider" className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Staff role<select required value={roleId} onChange={(event) => { setRoleId(event.target.value); setIsBranchManager(false); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]"><option value="">Choose a role</option>{availableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Store / business<select required value={businessId} onChange={(event) => { setBusinessId(event.target.value); setBranchId(""); setStoreManagerProfileId(""); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]"><option value="">Choose a store</option>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Branch<select required value={branchId} onChange={(event) => { setBranchId(event.target.value); setStoreManagerProfileId(""); }} disabled={!businessId} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37] disabled:bg-slate-100"><option value="">{businessId ? "Choose a branch" : "Choose a store first"}</option>{availableBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Department<select required value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setStoreManagerProfileId(""); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]"><option value="">Choose a department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        {canDirectSignIn && <>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">Department login password<input required type="password" minLength={10} autoComplete="new-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">Confirm login password<input required type="password" minLength={10} autoComplete="new-password" value={confirmLoginPassword} onChange={(event) => setConfirmLoginPassword(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
        </>}
        {canManageBranch && <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700"><input type="checkbox" checked={isBranchManager} onChange={(event) => setIsBranchManager(event.target.checked)} className="h-4 w-4 accent-[#03162F]" />This staff member manages the branch</label>}
        {!isBranchManager && !canDirectSignIn && <label className="grid gap-1 text-xs font-semibold text-slate-600">Department manager<select required value={storeManagerProfileId} onChange={(event) => setStoreManagerProfileId(event.target.value)} disabled={!branchId || !departmentId} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37] disabled:bg-slate-100"><option value="">{branchId && departmentId ? "Choose a manager for this department" : "Select branch and department first"}</option>{availableManagers.map((manager) => <option key={manager.id} value={manager.id}>{manager.display_name || manager.email}{manager.email ? ` · ${manager.email}` : ""}</option>)}</select></label>}
        <label className="grid gap-1 text-xs font-semibold text-slate-600">4-digit PIN<input required type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="new-password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} className="h-10 rounded-lg border border-slate-200 px-3 text-center text-sm tracking-[.35em] text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Confirm PIN<input required type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="new-password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))} className="h-10 rounded-lg border border-slate-200 px-3 text-center text-sm tracking-[.35em] text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
        <button type="submit" disabled={pending || availableRoles.length === 0 || businesses.length === 0 || branches.length === 0 || departments.length === 0} className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#03162F] px-4 text-sm font-bold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-50"><UserPlus className="h-4 w-4" />{pending ? "Creating…" : "Create staff login"}</button>
      </form>
      <p className="mt-3 text-xs leading-5 text-slate-500">AEOS creates a linked employee record. Managers and department heads sign in with their own password and are scoped to their assigned department, business, and branch. Other staff are assigned to a department manager and use their PIN after that manager opens operations.</p>
    </section>
  );
}
