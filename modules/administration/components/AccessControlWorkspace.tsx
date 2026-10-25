"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, ShieldCheck, UsersRound, Save, Activity, KeyRound, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStaffAccount, setStaffOperatorPin, updateRolePermissions, updateStaffAccount } from "@/app/dashboard/administration/access-actions";
import type { AccessPermission, AccessRole, StaffAccount } from "../services/access-control.service";

interface AccessControlWorkspaceProps {
  roles: AccessRole[];
  permissions: AccessPermission[];
  assignments: { role_id: string; permission_id: string }[];
  staff: StaffAccount[];
  viewerRoleName: string;
  businesses: { id: string; name: string }[];
  branches: { id: string; business_id: string; name: string }[];
  departments: { id: string; name: string }[];
  storeManagers: StaffAccount[];
}

type StaffEditForm = { fullName: string; phone: string; position: string; roleId: string; businessId: string; branchId: string; departmentId: string; storeManagerProfileId: string; newPassword: string };

export default function AccessControlWorkspace({ roles, permissions, assignments, staff, viewerRoleName, businesses, branches, departments, storeManagers }: AccessControlWorkspaceProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const assigned = useMemo(() => new Set(assignments.filter((item) => item.role_id === selectedRoleId).map((item) => item.permission_id)), [assignments, selectedRoleId]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([...assigned]);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [pinAccountId, setPinAccountId] = useState<string | null>(null);
  const [staffPin, setStaffPin] = useState("");
  const [confirmStaffPin, setConfirmStaffPin] = useState("");
  const [editingAccount, setEditingAccount] = useState<StaffAccount | null>(null);
  const [editForm, setEditForm] = useState<StaffEditForm>({ fullName: "", phone: "", position: "", roleId: "", businessId: "", branchId: "", departmentId: "", storeManagerProfileId: "", newPassword: "" });
  const isSuperAdmin = viewerRoleName === "Super Administrator";
  const selectedRole = roles.find((role) => role.id === selectedRoleId);

  function chooseRole(roleId: string) {
    setSelectedRoleId(roleId);
    setSelectedPermissionIds(assignments.filter((item) => item.role_id === roleId).map((item) => item.permission_id));
    setSearch("");
  }

  const visiblePermissions = permissions.filter((permission) => `${permission.module} ${permission.name} ${permission.permission_key}`.toLowerCase().includes(search.trim().toLowerCase()));
  const modules = [...new Set(visiblePermissions.map((permission) => permission.module))];

  function togglePermission(permission: AccessPermission) {
    if (permission.permission_key === "access.super_admin" && !isSuperAdmin) return;
    setSelectedPermissionIds((current) => current.includes(permission.id) ? current.filter((id) => id !== permission.id) : [...current, permission.id]);
  }

  function savePermissions() {
    startTransition(async () => {
      try {
        await updateRolePermissions(selectedRoleId, selectedPermissionIds);
        toast.success("Role permissions saved.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save role permissions.");
      }
    });
  }

  function beginEdit(account: StaffAccount) {
    setEditingAccount(account);
    setEditForm({ fullName: account.display_name || "", phone: account.phone || "", position: account.position || "", roleId: account.role_id || "", businessId: account.business_id || "", branchId: account.branch_id || "", departmentId: account.department_id || "", storeManagerProfileId: account.store_manager_profile_id || "", newPassword: "" });
  }

  const editBranches = branches.filter((branch) => branch.business_id === editForm.businessId);
  const editManagers = storeManagers.filter((manager) => manager.business_id === editForm.businessId && manager.branch_id === editForm.branchId && manager.department_id === editForm.departmentId && manager.id !== editingAccount?.id);
  const editRole = roles.find((role) => role.id === editForm.roleId);
  const operationsPermissionId = permissions.find((permission) => permission.permission_key === "operations.open")?.id;
  const editRoleDirectLogin = Boolean(editRole && operationsPermissionId && assignments.some((assignment) => assignment.role_id === editRole.id && assignment.permission_id === operationsPermissionId));

  function saveStaffAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAccount) return;
    startTransition(async () => {
      try {
        await updateStaffAccount({ profileId: editingAccount.id, ...editForm, storeManagerProfileId: editForm.storeManagerProfileId || null });
        toast.success("Staff details and department assignment updated.");
        setEditingAccount(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update this staff account.");
      }
    });
  }

  function removeStaffAccount(account: StaffAccount) {
    if (!window.confirm(`Remove ${account.display_name || account.email} from active AEOS access? Historical employee and financial records will be retained.`)) return;
    startTransition(async () => {
      try {
        await deleteStaffAccount(account.id);
        toast.success("Staff access removed. Historical records were retained.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not remove this staff account.");
      }
    });
  }

  function saveStaffPin(account: StaffAccount, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}$/.test(staffPin)) return toast.error("Enter a four-digit PIN.");
    if (staffPin !== confirmStaffPin) return toast.error("The PINs do not match.");
    startTransition(async () => {
      try {
        const result = await setStaffOperatorPin(account.id, staffPin);
        toast.success(`Staff PIN updated for ${result.email}.`);
        setPinAccountId(null);
        setStaffPin("");
        setConfirmStaffPin("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update this staff PIN.");
      }
    });
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.8fr)]">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]"><ShieldCheck className="h-5 w-5" /></span>
            <div><h2 className="font-bold text-[#03162F]">Role permission matrix</h2><p className="text-xs text-slate-500">Choose a role, then enable the areas and actions it needs.</p></div>
          </div>
          <label className="relative block w-full sm:max-w-[230px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find permission" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#D4AF37]" /></label>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3">
          {roles.map((role) => <button key={role.id} type="button" onClick={() => chooseRole(role.id)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${selectedRoleId === role.id ? "bg-[#03162F] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{role.name}</button>)}
        </div>
        <div className="max-h-[620px] space-y-5 overflow-y-auto p-5">
          {modules.map((module) => (
            <fieldset key={module} className="rounded-xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-bold capitalize text-[#03162F]">{module.replaceAll("_", " ")}</legend>
              <div className="grid gap-2 md:grid-cols-2">
                {visiblePermissions.filter((permission) => permission.module === module).map((permission) => {
                  const checked = selectedRole?.name === "Super Administrator" || selectedPermissionIds.includes(permission.id);
                  const restricted = permission.permission_key === "access.super_admin" && !isSuperAdmin;
                  return <label key={permission.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${checked ? "border-[#D4AF37]/50 bg-[#FBF8EC]" : "border-slate-100 bg-white"} ${restricted ? "cursor-not-allowed opacity-50" : ""}`}>
                    <input type="checkbox" checked={checked} disabled={restricted} onChange={() => togglePermission(permission)} className="mt-0.5 h-4 w-4 accent-[#03162F]" />
                    <span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">{permission.name}</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">{permission.description || permission.permission_key}</span></span>
                  </label>;
                })}
              </div>
            </fieldset>
          ))}
          {visiblePermissions.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No matching permissions.</p>}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs text-slate-500">{selectedRole?.name === "Super Administrator" ? "Full enterprise access" : `${selectedPermissionIds.length} permission${selectedPermissionIds.length === 1 ? "" : "s"} selected`}</p>
          <button type="button" disabled={pending || !selectedRoleId || selectedRole?.name === "Super Administrator"} onClick={savePermissions} className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{pending ? "Saving…" : selectedRole?.name === "Super Administrator" ? "Full access" : "Save role access"}</button>
        </div>
      </section>

      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F2DF] text-[#8B6A0B]"><UsersRound className="h-5 w-5" /></span><div><h2 className="font-bold text-[#03162F]">Staff role assignments</h2><p className="text-xs text-slate-500">Active accounts with platform profiles.</p></div></div>
          <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">
            {staff.map((account) => <div key={account.id} className="space-y-3 p-4">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{account.display_name || account.email}</p><p className="truncate text-xs text-slate-500">{account.email}</p><p className={`mt-1 text-[11px] font-semibold ${account.active ? "text-emerald-700" : "text-slate-400"}`}>{account.active ? "Active login" : "Login disabled"}</p></div>
                <span className="max-w-[160px] truncate rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700">{account.role_name || "No role"}</span>
              </div>
              {pinAccountId === account.id ? <form onSubmit={(event) => saveStaffPin(account, event)} className="grid gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#FBF8EC] p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                <label className="grid gap-1 text-[11px] font-semibold text-slate-600">New 4-digit PIN<input required type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="new-password" value={staffPin} onChange={(event) => setStaffPin(event.target.value.replace(/\D/g, "").slice(0, 4))} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm tracking-[.35em] outline-none focus:border-[#D4AF37]" /></label>
                <label className="grid gap-1 text-[11px] font-semibold text-slate-600">Confirm PIN<input required type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="new-password" value={confirmStaffPin} onChange={(event) => setConfirmStaffPin(event.target.value.replace(/\D/g, "").slice(0, 4))} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm tracking-[.35em] outline-none focus:border-[#D4AF37]" /></label>
                <button type="submit" disabled={pending} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#03162F] px-3 text-xs font-bold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" />{pending ? "Saving…" : "Save PIN"}</button>
                <button type="button" onClick={() => { setPinAccountId(null); setStaffPin(""); setConfirmStaffPin(""); }} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"><X className="h-3.5 w-3.5" />Cancel</button>
              </form> : <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => beginEdit(account)} disabled={pending || !account.active || ["Super Administrator", "Enterprise Manager"].includes(account.role_name ?? "")} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#03162F] hover:border-[#D4AF37] hover:bg-[#FBF8EC] disabled:cursor-not-allowed disabled:opacity-50"><Pencil className="h-3.5 w-3.5" />Edit staff</button>
                <button type="button" onClick={() => removeStaffAccount(account)} disabled={pending || !account.active || ["Super Administrator", "Enterprise Manager"].includes(account.role_name ?? "")} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Delete staff</button>
                <button type="button" onClick={() => { setPinAccountId(account.id); setStaffPin(""); setConfirmStaffPin(""); }} disabled={pending || !account.active} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#03162F] hover:border-[#D4AF37] hover:bg-[#FBF8EC] disabled:cursor-not-allowed disabled:opacity-50"><KeyRound className="h-3.5 w-3.5" />Set or reset staff PIN</button>
              </div>}
            </div>)}
            {staff.length === 0 && <p className="p-6 text-sm text-slate-500">No active staff profiles are available.</p>}
          </div>
        </section>
        <section className="rounded-2xl border border-[#D4AF37]/30 bg-[#FBF8EC] p-5">
          <div className="flex items-center gap-2 text-[#03162F]"><Activity className="h-4 w-4 text-[#9B7910]" /><h2 className="text-sm font-bold">Access governance</h2></div>
          <p className="mt-2 text-sm leading-5 text-slate-600">Super Administrators retain full access. Enterprise Managers can manage operational access but cannot grant the Super Administrator role. Staff assignments and permission changes are recorded for review.</p>
          <a href="/dashboard/administration/activity" className="mt-3 inline-flex text-sm font-bold text-[#03162F] hover:underline">Review activity log →</a>
        </section>
      </div>
      {editingAccount && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-staff-title">
        <form onSubmit={saveStaffAccount} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4"><div><h2 id="edit-staff-title" className="text-lg font-bold text-[#03162F]">Edit staff account</h2><p className="mt-1 text-xs text-slate-500">Update staff details, role, and departmental assignment for {editingAccount.email}.</p></div><button type="button" onClick={() => setEditingAccount(null)} aria-label="Close edit staff form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
          <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Full name<input required minLength={2} value={editForm.fullName} onChange={(event) => setEditForm({ ...editForm, fullName: event.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 focus:border-[#D4AF37] focus:outline-none" /></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Work email<input readOnly value={editingAccount.email} title="Login email is managed separately" className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-500" /></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Phone<input required type="tel" value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 focus:border-[#D4AF37] focus:outline-none" /></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Job title<input required value={editForm.position} onChange={(event) => setEditForm({ ...editForm, position: event.target.value })} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 focus:border-[#D4AF37] focus:outline-none" /></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Staff role<select required value={editForm.roleId} onChange={(event) => setEditForm({ ...editForm, roleId: event.target.value, storeManagerProfileId: "", newPassword: "" })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#D4AF37] focus:outline-none"><option value="">Choose a role</option>{roles.filter((role) => role.status === "Active" && !["Customer", "Customer Portal User", "Super Administrator", "Enterprise Manager"].includes(role.name)).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Store / business<select required value={editForm.businessId} onChange={(event) => setEditForm({ ...editForm, businessId: event.target.value, branchId: "", storeManagerProfileId: "" })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#D4AF37] focus:outline-none"><option value="">Choose a store</option>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Branch<select required value={editForm.branchId} onChange={(event) => setEditForm({ ...editForm, branchId: event.target.value, storeManagerProfileId: "" })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#D4AF37] focus:outline-none"><option value="">Choose a branch</option>{editBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">Department<select required value={editForm.departmentId} onChange={(event) => setEditForm({ ...editForm, departmentId: event.target.value, storeManagerProfileId: "" })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#D4AF37] focus:outline-none"><option value="">Choose a department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            {editRoleDirectLogin ? <label className="grid gap-1 text-xs font-semibold text-slate-600 sm:col-span-2">New login password (optional unless promoting PIN-only staff)<input type="password" minLength={10} autoComplete="new-password" value={editForm.newPassword} onChange={(event) => setEditForm({ ...editForm, newPassword: event.target.value })} placeholder="At least 10 characters" className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900 focus:border-[#D4AF37] focus:outline-none" /></label> : <label className="grid gap-1 text-xs font-semibold text-slate-600 sm:col-span-2">Department manager<select required value={editForm.storeManagerProfileId} onChange={(event) => setEditForm({ ...editForm, storeManagerProfileId: event.target.value })} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#D4AF37] focus:outline-none"><option value="">Choose a manager for this department</option>{editManagers.map((manager) => <option key={manager.id} value={manager.id}>{manager.display_name || manager.email}</option>)}</select></label>}
            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">Changing the assigned department also changes which staff records this account can access. The login email is shown above and remains unchanged.</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4"><button type="button" onClick={() => setEditingAccount(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{pending ? "Saving…" : "Save staff"}</button></div>
        </form>
      </div>}
    </div>
  );
}
