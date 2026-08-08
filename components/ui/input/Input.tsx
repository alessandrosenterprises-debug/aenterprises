import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="mb-2 block text-left text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={`
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

Input.displayName = "Input";

export default Input;