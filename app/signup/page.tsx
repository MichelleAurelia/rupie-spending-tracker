/**
 * Signup page — server component wrapper.
 *
 * Same pattern as the login page: loads dictionary → passes to form.
 */
import { getDictionary } from "@/lib/i18n/dictionaries";
import SignupForm from "./signup-form";

export default async function SignupPage() {
  const dict = await getDictionary();

  return <SignupForm dict={dict} />;
}
