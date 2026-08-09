"use client";

import Modal from "@/components/ui/modal/Modal";

interface AEDetailsModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AEDetailsModal({
  open,
  title,
  onClose,
  children,
}: AEDetailsModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
    >
      <div className="space-y-5">
        {children}

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#03162F] px-5 py-2 font-semibold text-white transition hover:bg-[#0A2852]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}