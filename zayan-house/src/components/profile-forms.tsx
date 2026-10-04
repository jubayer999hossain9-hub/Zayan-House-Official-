"use client";

import { useFormAction } from "@/lib/use-form-action";
import { updateProfile, changePassword } from "@/app/actions/account";

function Field({ name, label, type = "text", defaultValue, autoComplete, error }: { name: string; label: string; type?: string; defaultValue?: string; autoComplete?: string; error?: string }) {
  return (
    <div>
      <label htmlFor={`p-${name}`} className="label">{label}</label>
      <input id={`p-${name}`} name={name} type={type} defaultValue={defaultValue} autoComplete={autoComplete} aria-invalid={error ? "true" : undefined} className="field" />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const { state, onSubmit, pending } = useFormAction(updateProfile);
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 border border-line bg-cream p-5 sm:p-6">
      <h2 className="text-2xl text-green">Your details</h2>
      {state.ok && <p role="status" className="border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">Profile updated.</p>}
      {state.error && <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Field name="name" label="Full name" defaultValue={name} autoComplete="name" error={state.fieldErrors?.name} />
      <Field name="phone" label="Mobile number" type="tel" defaultValue={phone} autoComplete="tel" error={state.fieldErrors?.phone} />
      <div>
        <label htmlFor="p-email" className="label">Email</label>
        <input id="p-email" value={email} readOnly className="field opacity-70" />
        <p className="mt-1 text-xs text-muted">To change your email, please contact us.</p>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}

export function PasswordForm() {
  const { state, onSubmit, pending } = useFormAction(changePassword);
  return (
    <form key={state.ok ? "done" : "form"} onSubmit={onSubmit} noValidate className="space-y-4 border border-line bg-cream p-5 sm:p-6">
      <h2 className="text-2xl text-green">Change password</h2>
      {state.ok && <p role="status" className="border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">Password changed. Other devices have been logged out.</p>}
      {state.error && <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Field name="current" label="Current password" type="password" autoComplete="current-password" error={state.fieldErrors?.current} />
      <Field name="next" label="New password (min 8 characters)" type="password" autoComplete="new-password" error={state.fieldErrors?.next} />
      <Field name="confirm" label="Confirm new password" type="password" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
