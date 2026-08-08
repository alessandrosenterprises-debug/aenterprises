import { ButtonHTMLAttributes } from "react";

interface SubmitButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function SubmitButton({
  loading = false,
  children,
  className = "",
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        bg-[#03162F]
        px-6
        py-3
        font-semibold
        text-white
        transition
        hover:bg-[#0A2852]
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}

      {loading ? "Saving..." : children}
    </button>
  );
}