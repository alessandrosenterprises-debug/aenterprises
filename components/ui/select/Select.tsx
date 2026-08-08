import { SelectHTMLAttributes, forwardRef } from "react";

interface Option {
  label: string;
  value: string;
}

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: Option[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder = "Select an option",
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}

        <select
          ref={ref}
          className={`
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            text-slate-900
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
        >
          <option value="">
            {placeholder}
          </option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;