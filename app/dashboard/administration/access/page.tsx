import { KeyRound, UsersRound } from "lucide-react";
import { getAccessControlData } from "@/modules/administration/services/access-control.service";
import AccessControlWorkspace from "@/modules/administration/components/AccessControlWorkspace";
import CreateStaffAccountForm from "@/modules/administration/components/CreateStaffAccountForm";

export default async function AccessControlPage() {
  const data = await getAccessControlData();
  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6">
      <header className="rounded-2xl bg-[#03162F] p-6 text-white shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Enterprise administration</p>
        <h1 className="mt-2 text-3xl font-bold">Roles, permissions & staff access</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Control the areas each role can use, assign roles to staff accounts, and keep access changes auditable across the enterprise.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"><KeyRound className="h-4 w-4 text-[#D4AF37]" />{data.roles.length} roles · {data.permissions.length} permissions</span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"><UsersRound className="h-4 w-4 text-[#D4AF37]" />{data.staff.length} active staff accounts</span>
        </div>
      </header>
      <CreateStaffAccountForm roles={data.roles} viewerRoleName={data.viewerRoleName} />
      <AccessControlWorkspace {...data} />
    </main>
  );
}
