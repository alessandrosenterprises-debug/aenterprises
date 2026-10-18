"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, ShieldCheck, UsersRound, Save, Activity } from "lucide-react";
import { toast } from "sonner";
import { updateRolePermissions, updateStaffRole } from "@/app/dashboard/administration/access-actions";
import type { AccessPermission, AccessRole, StaffAccount } from "../services/access-control.service";

interface AccessControlWorkspaceProps {
  roles: AccessRole[];
  permissions: AccessPermission[];
  assignments: { role_id: string; permission_id: string }[];
  staff: StaffAccount[];
  viewerRoleName: string;
}

export default function AccessControlWorkspace({ roles, permissions, assignments, staff, viewerRoleName }: AccessControlWorkspaceProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const assigned = useMemo(() => new Set(assignments.filter((item) => item.role_id === selectedRoleId).map((item) => item.permission_id)), [assignments, selectedRoleId]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([...assigned]);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
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

  function saveStaffRole(profileId: string, roleId: string) {
    startTransition(async () => {
      try {
        await updateStaffRole(profileId, roleId);
        toast.success("Staff role updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update this staff role.");
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
            {staff.map((account) => <div key={account.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{account.display_name || account.email}</p><p className="truncate text-xs text-slate-500">{account.email}</p></div>
              <select aria-label={`Role for ${account.display_name || account.email}`} value={account.role_id ?? ""} onChange={(event) => saveStaffRole(account.id, event.target.value)} disabled={pending} className="max-w-[160px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#D4AF37]">
                <option value="" disabled>No role</option>
                {roles.filter((role) => role.status === "Active" && role.name !== "Customer" && (isSuperAdmin || role.name !== "Super Administrator")).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
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
    </div>
  );
}
