"use client";

import { useRef, useState } from "react";

type Props = {
  action: (f: FormData) => Promise<string | null>;
  label: string;
  doneLabel?: string;
  /** Names starting with this prefix are cleared after a successful save (blank "new" cards). */
  clearPrefix?: string;
  /** Fixed bar at the bottom of the screen, always in reach. */
  sticky?: boolean;
  children?: React.ReactNode;
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

// One form, one button: runs a server action and always says what happened
// ("Guardando…", "✓ Guardado" or the error). The action returns null on success.
export default function SaveForm({ action, label, doneLabel = "✓ Todo guardado", clearPrefix, sticky, children }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const removing = form.querySelectorAll('input[name$=".delete"]:checked').length;
    if (removing && !window.confirm(`Vas a eliminar ${removing} elemento${removing > 1 ? "s" : ""}. ¿Continuar?`)) return;

    setState("saving");
    const data = new FormData(form);
    for (const [k, v] of [...data.entries()]) {
      if (v instanceof File && v.size > 0 && v.type.startsWith("image/")) data.set(k, await shrink(v));
    }
    const err = await action(data).catch(() => "No se pudo guardar. Intenta de nuevo.");
    if (err) {
      setError(err);
      setState("error");
      return;
    }
    if (clearPrefix) {
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(`[name^="${clearPrefix}"]`).forEach((el) => {
        if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) el.checked = el.defaultChecked && el.name.endsWith(".available");
        else el.value = "";
      });
    }
    setState("done");
    setTimeout(() => setState("idle"), 3000);
  }

  return (
    <form ref={ref} onSubmit={submit}>
      {children}
      <div className={sticky ? "save-bar" : "save-row"}>
        <div className="save-bar-in">
          <button className="save" disabled={state === "saving"}>{state === "saving" ? "Guardando…" : label}</button>
          {state === "done" && <span className="ok">{doneLabel}</span>}
          {state === "error" && <span className="err">{error}</span>}
          {state === "idle" && sticky && <span className="muted save-hint">Los cambios no se aplican hasta que guardes.</span>}
        </div>
      </div>
    </form>
  );
}
