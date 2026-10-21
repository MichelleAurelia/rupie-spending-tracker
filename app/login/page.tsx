/**
 * Login page — server component wrapper.
 *
 * This page is a Server Component that loads the dictionary and
 * passes it to the LoginForm client component.
 * The actual form logic lives in LoginForm because useActionState
 * (for showing loading/error states) only works in Client Components.
 */
import { getDictionary } from "@/lib/i18n/dictionaries";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const dict = await getDictionary();

  return <LoginForm dict={dict} />;
}
