"use client";

import { useActionState, startTransition } from "react";
import type { FormState } from "@/lib/validation";

type Field = { name: string; label: string; type?: string; autoComplete?: string; placeholder?: string };
type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function AuthForm({
  action,
  fields,
  submitLabel,
  next,
}: {
  action: Action;
  fields: Field[];
  submitLabel: string;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  return (
    <form
      onSubmit={(e) => {
        // Submitting through onSubmit (instead of the action prop) stops React from wiping the fields after an error.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-5"
      noValidate
    >
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && (
        <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {fields.map((f) => {
        const err = state.fieldErrors?.[f.name];
        return (
          <div key={f.name}>
            <label htmlFor={f.name} className="label">{f.label}</label>
            <input
              id={f.name}
              name={f.name}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              aria-invalid={err ? "true" : undefined}
              aria-describedby={err ? `${f.name}-error` : undefined}
              className="field"
            />
            {err && <p id={`${f.name}-error`} className="field-error">{err}</p>}
          </div>
        );
      })}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
