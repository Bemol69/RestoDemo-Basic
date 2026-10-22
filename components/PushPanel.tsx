"use client";

import { useEffect, useState } from "react";

type State = "checking" | "unsupported" | "unconfigured" | "off" | "on" | "denied";

function keyToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const save = (sub: PushSubscription) =>
  fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub.toJSON()) });

// "Activar avisos": sound + system notifications on this device, even with the app closed (Web Push).
export default function PushPanel({ unlockSound }: { unlockSound: () => void }) {
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      const { key } = await fetch("/api/push", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ key: null }));
      if (!key) return setState("unconfigured");
      if (Notification.permission === "denied") return setState("denied");
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (sub && Notification.permission === "granted") {
          await save(sub); // make sure the server still knows this phone
          setState("on");
        } else setState("off");
      } catch {
        setState("unsupported");
      }
    })();
  }, []);

  async function enable() {
    setBusy(true);
    setMsg("");
    unlockSound();
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
      const { key } = await fetch("/api/push").then((r) => r.json());
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key) }));
      const res = await save(sub);
      if (!res.ok) throw new Error("save");
      setState("on");
    } catch {
      setMsg("No se pudo activar. Revisa que el navegador permita notificaciones e inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/push", { method: "PUT" }).then((r) => r.json()).catch(() => null);
    setMsg(res?.sent ? "Aviso de prueba enviado. Debería llegarte en unos segundos." : "No se pudo enviar. Desactiva y vuelve a activar los avisos.");
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    setState("off");
    setMsg("");
    setBusy(false);
  }

  if (state === "checking") return null;

  return (
    <div className="panel noprint">
      {state === "on" && (
        <>
          <strong className="ok">✓ Avisos activos en este dispositivo</strong>
          <p className="muted" style={{ margin: ".3rem 0 .7rem" }}>Te llegará una notificación cuando una mesa llame, aunque la app esté cerrada o la pantalla bloqueada.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="ghost" disabled={busy} onClick={test} style={{ flex: "0 0 auto" }}>Enviar aviso de prueba</button>
            <button className="danger" disabled={busy} onClick={disable} style={{ flex: "0 0 auto" }}>Desactivar</button>
          </div>
        </>
      )}
      {state === "off" && (
        <>
          <strong>Activa los avisos en este celular</strong>
          <p className="muted" style={{ margin: ".3rem 0 .7rem" }}>Así te avisamos cuando una mesa llame, aunque tengas la app cerrada.</p>
          <button disabled={busy} onClick={enable}>🔔 Activar avisos</button>
        </>
      )}
      {state === "denied" && (
        <p style={{ margin: 0 }}><strong>Las notificaciones están bloqueadas.</strong> <span className="muted">En Chrome toca el candado junto a la dirección → Permisos → Notificaciones → Permitir, y recarga.</span></p>
      )}
      {state === "unconfigured" && <p className="muted" style={{ margin: 0 }}>Los avisos al celular aún no están configurados en el servidor. El panel igual se actualiza solo.</p>}
      {state === "unsupported" && <p className="muted" style={{ margin: 0 }}>Este navegador no admite avisos con la app cerrada. Usa Chrome en Android. El panel igual se actualiza solo.</p>}
      {msg && <p className="muted" style={{ margin: ".6rem 0 0" }}>{msg}</p>}
    </div>
  );
}
