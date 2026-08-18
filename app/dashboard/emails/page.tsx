import {
  getEmails,
  getEmailStats,
} from "@/modules/emails/services/email.service";

import EmailManager from "@/modules/emails/components/EmailManager";

export default async function EmailsPage() {
  const [emails, stats] = await Promise.all([
    getEmails(),
    getEmailStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Email Management
        </h1>

        <p className="mt-1 text-slate-500">
          Manage incoming emails, replies and outgoing
          communication from one place.
        </p>
      </div>

      <EmailManager
        initialEmails={emails}
        stats={stats}
      />
    </div>
  );
}