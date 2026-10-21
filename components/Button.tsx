/**
 * Reusable Button component.
 *
 * Variants:
 *   - "primary"  → filled green button (default)
 *   - "outline"  → bordered, transparent background
 *   - "ghost"    → no border, subtle hover
 *
 * Props:
 *   - fullWidth  → stretches to 100%
 *   - loading    → shows a spinner and disables the button
 *   - Everything else is passed to the native <button>
 */
import React from "react";

type Variant = "primary" | "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 shadow-[var(--shadow-btn)] px-6 py-3 rounded-[var(--radius-btn)]",
  outline:
    "border-2 border-primary-400 text-primary-600 hover:bg-primary-50 [html[data-theme=dark]_&]:text-primary-300 [html[data-theme=dark]_&]:hover:bg-primary-700/20 px-6 py-3 rounded-[var(--radius-btn)]",
  ghost:
    "text-text-muted hover:text-text hover:bg-surface-raised px-4 py-2 rounded-[var(--radius-btn)]",
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
