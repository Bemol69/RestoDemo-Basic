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

// Phone photos are huge; shrink them in the browser (max 1400px, JPEG) before uploading.
async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

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
    const data = new FormData(e.currentTarget);
    for (const [k, v] of [...data.entries()]) {
      if (v instanceof File && v.size > 0 && v.type.startsWith("image/")) data.set(k, await shrink(v));
    }
    const err = await action(data).catch(() => "No se pudo guardar. Intenta de nuevo.");
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
