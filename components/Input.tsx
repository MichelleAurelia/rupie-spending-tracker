/**
 * Reusable Input component.
 *
 * Features:
 *   - Floating-style label above the field
 *   - Error message display below
 *   - Consistent styling with design tokens
 */
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({
  label,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-text-muted"
      >
        {label}
      </label>

      <input
        id={inputId}
        className={`
          w-full rounded-[var(--radius-input)] border border-border
          bg-surface px-4 py-3 text-text
          placeholder:text-text-muted/50
          transition-all duration-200
          focus:border-primary-400 focus:ring-2 focus:ring-primary-200 focus:outline-none
          ${error ? "border-warning-400 focus:border-warning-400 focus:ring-warning-300" : ""}
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="text-sm text-warning-500 animate-[fadeIn_0.2s_ease-out]">
          {error}
        </p>
      )}
    </div>
  );
}
