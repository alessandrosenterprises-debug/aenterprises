import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          className={`
            min-h-[120px]
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            text-slate-900
            placeholder:text-slate-400
            px-4
            py-3
            outline-none
            transition
            focus:border-[#D4AF37]
            focus:ring-2
            focus:ring-[#D4AF37]/30
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;