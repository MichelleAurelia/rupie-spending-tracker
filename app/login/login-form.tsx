/**
 * LoginForm — client component with form validation and server action.
 *
 * How it works:
 *   1. User fills in email + password.
 *   2. Client-side validation runs first (fast feedback).
 *   3. If valid, the form calls the loginAction Server Action.
 *   4. useActionState gives us loading + error states.
 *   5. If login succeeds, the server action redirects to /.
 */
"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, type AuthResult } from "@/app/auth/actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Button from "@/components/Button";

interface LoginFormProps {
  dict: Dictionary;
}

export default function LoginForm({ dict }: LoginFormProps) {
  const t = dict.login;
  const v = dict.validation;

  // useActionState connects the form to the server action
  // state = the error returned by loginAction (or null)
  // isPending = true while the server action is running
  const [state, formAction, isPending] = useActionState<AuthResult, FormData>(
    loginAction,
    null
  );

  // Client-side validation errors
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  function validate(formData: FormData): boolean {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const newErrors: typeof errors = {};

    if (!email) newErrors.email = v.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = v.emailInvalid;

    if (!password) newErrors.password = v.passwordRequired;
    else if (password.length < 6) newErrors.password = v.passwordTooShort;

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
            autoComplete="current-password"
            error={errors.password}
            required
          />

          <Button type="submit" fullWidth loading={isPending} className="mt-2">
            {isPending ? t.loading : t.submit}
          </Button>
        </form>

        {/* Link to signup */}
        <p className="mt-6 text-center text-sm text-text-muted">
          {t.noAccount}{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary-500 hover:text-primary-600 transition-colors"
          >
            {t.signupLink}
          </Link>
        </p>
      </Card>
    </div>
  );
}
