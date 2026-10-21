/**
 * Reusable Card component.
 *
 * A rounded, elevated container with optional glassmorphism.
 * Uses design tokens for radius, shadow, and surface color.
 */
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export default function Card({
  children,
  className = "",
  glass = false,
}: CardProps) {
  return (
    <div
      className={`
        rounded-[var(--radius-card)]
        shadow-[var(--shadow-card)]
        p-6
        transition-all duration-200
        ${
          glass
            ? "bg-surface/70 backdrop-blur-xl border border-border/50"
            : "bg-surface border border-border"
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}
