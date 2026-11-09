"use client";

import { useFormStatus } from "react-dom";

export default function LoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}
