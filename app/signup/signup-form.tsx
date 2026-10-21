/**
 * SignupForm — client component with form validation and server action.
 *
 * Same pattern as LoginForm but with a confirm-password field.
 */
"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signupAction, type AuthResult } from "@/app/auth/actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Button from "@/components/Button";

interface SignupFormProps {
  dict: Dictionary;
}

export default function SignupForm({ dict }: SignupFormProps) {
  const t = dict.signup;
  const v = dict.validation;

  const [state, formAction, isPending] = useActionState<AuthResult, FormData>(
    signupAction,
    null
  );

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate(formData: FormData): boolean {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const newErrors: typeof errors = {};

    if (!email) newErrors.email = v.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = v.emailInvalid;

    if (!password) newErrors.password = v.passwordRequired;
    else if (password.length < 6) newErrors.password = v.passwordTooShort;

    if (!confirmPassword)
      newErrors.confirmPassword = v.confirmPasswordRequired;
    else if (password !== confirmPassword)
      newErrors.confirmPassword = v.passwordsMismatch;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-500 mb-1">
            {dict.app.name}
          </h1>
          <h2 className="text-xl font-semibold text-text">{t.title}</h2>
          <p className="text-text-muted mt-1">{t.subtitle}</p>
        </div>

        {/* Server error */}
        {state?.error && (
          <div className="mb-4 rounded-[var(--radius-input)] bg-warning-300/20 border border-warning-400/30 px-4 py-3 text-sm text-warning-500">
            {state.error}
          </div>
        )}

        {/* Form */}
        <form
          action={(formData) => {
            if (validate(formData)) {
              formAction(formData);
            }
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            label={t.email}
            name="email"
            type="email"
            placeholder={t.emailPlaceholder}
            autoComplete="email"
            error={errors.email}
            required
          />

          <Input
            label={t.password}
            name="password"
            type="password"
            placeholder={t.passwordPlaceholder}
            autoComplete="new-password"
            error={errors.password}
            required
          />

          <Input
            label={t.confirmPassword}
            name="confirmPassword"
            type="password"
            placeholder={t.confirmPasswordPlaceholder}
            autoComplete="new-password"
            error={errors.confirmPassword}
            required
          />

          <Button type="submit" fullWidth loading={isPending} className="mt-2">
            {isPending ? t.loading : t.submit}
          </Button>
        </form>

        {/* Link to login */}
        <p className="mt-6 text-center text-sm text-text-muted">
          {t.hasAccount}{" "}
          <Link
            href="/login"
            className="font-semibold text-primary-500 hover:text-primary-600 transition-colors"
          >
            {t.loginLink}
          </Link>
        </p>
      </Card>
    </div>
  );
}
