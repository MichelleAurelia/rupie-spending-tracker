/**
 * Logout button — client component.
 *
 * We need a client component because the logout action is called
 * from a <form> that needs interactivity (loading state).
 */
"use client";

import { logoutAction } from "@/app/auth/actions";
import Button from "@/components/Button";
import { useTransition } from "react";

interface LogoutButtonProps {
  label: string;
}

export default function LogoutButton({ label }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
    >
      <Button type="submit" variant="outline" fullWidth loading={isPending}>
        {label}
      </Button>
    </form>
  );
}
