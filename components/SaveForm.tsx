"use client";

import { useRef, useState } from "react";

type Props = {
  action: (f: FormData) => Promise<string | null>;
  label: string;
  doneLabel?: string;
  resetOnSave?: boolean;
  confirm?: string;
  danger?: boolean;
  ghost?: boolean;
  children?: React.ReactNode;
  className?: string;
};

// Runs a server action from a form and always tells the user what happened:
// "Guardando…", "✓ Guardado" or the error. Server actions return null on success.
export default function SaveForm({ action, label, doneLabel = "✓ Guardado", resetOnSave, confirm: ask, danger, ghost, children, className }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ask && !window.confirm(ask)) return;
    setState("saving");
    const err = await action(new FormData(e.currentTarget)).catch(() => "No se pudo guardar. Intenta de nuevo.");
    if (err) {
      setError(err);
      setState("error");
      return;
    }
    if (resetOnSave) ref.current?.reset();
    setState("done");
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <form ref={ref} onSubmit={submit} className={className}>
      {children}
      <div className="save-row">
        <button className={danger ? "danger" : ghost ? "ghost" : "save"} disabled={state === "saving"}>
          {state === "saving" ? "Guardando…" : label}
        </button>
        {state === "done" && <span className="ok">{doneLabel}</span>}
        {state === "error" && <span className="err">{error}</span>}
      </div>
    </form>
  );
}
