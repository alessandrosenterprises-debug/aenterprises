"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({
  open,
  title,
  onClose,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-6 backdrop-blur-sm">

      <div className="my-8 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl bg-[#03162F] px-6 py-5">

          <h2 className="text-xl font-semibold text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-white hover:opacity-70"
          >
            ×
          </button>

        </div>

        <div
  className="
    max-h-[75vh]
    overflow-y-auto
    p-6
  "
>
          {children}
        </div>

      </div>

    </div>
  );
}