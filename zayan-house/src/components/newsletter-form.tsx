"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import type { FormState } from "@/lib/validation";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, {});
  if (state.ok) return <p role="status" className="font-medium text-green">Thank you! You are on the list.</p>;
  return (
    <form action={action} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row" noValidate>
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="Your email address" className="field flex-1" />
      <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "…" : "Subscribe"}</button>
      {state.error && <p role="alert" className="text-sm text-danger sm:basis-full">{state.error}</p>}
    </form>
  );
}
