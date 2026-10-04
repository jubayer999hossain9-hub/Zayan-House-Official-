"use client";

import { useActionState, startTransition } from "react";
import type { FormState } from "./validation";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * Runs a server action from a form WITHOUT React clearing the typed values when the
 * server answers with an error (so a customer never has to retype everything).
 */
export function useFormAction(action: Action) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };
  return { state, onSubmit, pending };
}
