import {
  getMessages,
  getMessageStats,
} from "@/modules/messages/services/message.service";

import MessagesManager from "@/modules/messages/components/MessagesManager";

export default async function MessagesPage() {
  const [messages, stats] = await Promise.all([
    getMessages(),
    getMessageStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Messages
        </h1>

        <p className="mt-1 text-slate-500">
          Manage customer enquiries, conversations and
          incoming service requests.
        </p>
      </div>

      <MessagesManager messages={messages} />
    </div>
  );
}