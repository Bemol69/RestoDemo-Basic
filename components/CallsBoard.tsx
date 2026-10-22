"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { answerCall } from "@/app/admin/actions";
import type { Call } from "@/lib/db";

function beep() {
  try {
    const ctx = new AudioContext();
    [880, 1175].forEach((f, n) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = f;
      const t = ctx.currentTime + n * 0.25;
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t);
      o.stop(t + 0.22);
    });
  } catch {}
}

const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso.replace(" ", "T") + "Z").getTime()) / 1000));
  return s < 60 ? `hace ${s}s` : `hace ${Math.floor(s / 60)} min`;
};

export default function CallsBoard() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notif, setNotif] = useState<NotificationPermission | "none">("none");
  const [, tick] = useState(0);
  const maxId = useRef<number | null>(null);
  const baseTitle = useRef("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/calls", { cache: "no-store" });
    if (!res.ok) return;
    const data: { calls: Call[] } = await res.json();
    const pending = data.calls.filter((c) => c.status === "pendiente");
    const newest = data.calls.reduce((m, c) => Math.max(m, c.id), 0);
    if (maxId.current !== null && newest > maxId.current) {
      beep();
      navigator.vibrate?.([300, 100, 300]);
      const fresh = pending.filter((c) => c.id > (maxId.current ?? 0));
      if ("Notification" in window && Notification.permission === "granted") {
        fresh.forEach((c) => new Notification(`🔔 Mesa ${c.table_label} te llama`, { body: "Un cliente necesita al mesero." }));
      }
    }
    maxId.current = Math.max(maxId.current ?? 0, newest);
    document.title = pending.length ? `(${pending.length}) Mesa ${pending[pending.length - 1].table_label} llama` : baseTitle.current;
    setCalls(data.calls);
    setLoaded(true);
  }, []);

  useEffect(() => {
    baseTitle.current = document.title;
    if ("Notification" in window) setNotif(Notification.permission);
    load();
    const t = setInterval(() => { load(); tick((n) => n + 1); }, 3000);
    return () => clearInterval(t);
  }, [load]);

  async function answer(id: number) {
    setCalls((cs) => cs.map((c) => (c.id === id ? { ...c, status: "atendido" } : c)));
    await answerCall(id);
    load();
  }

  async function enableNotifications() {
    beep(); // unlocks audio in the browser
    if ("Notification" in window) setNotif(await Notification.requestPermission());
  }

  const pending = calls.filter((c) => c.status === "pendiente").reverse();
  const done = calls.filter((c) => c.status !== "pendiente");

  return (
    <>
      {notif !== "granted" && (
        <div className="panel noprint">
          <strong>Activa los avisos</strong>
          <p className="muted" style={{ margin: ".3rem 0 .6rem" }}>Para que suene y te llegue una notificación cuando una mesa llame, aunque estés en otra pestaña.</p>
          <button onClick={enableNotifications}>🔔 Activar sonido y notificaciones</button>
        </div>
      )}

      <h1>{pending.length ? `${pending.length} mesa${pending.length > 1 ? "s" : ""} llamando` : "Todo tranquilo"}</h1>
      {loaded && pending.length === 0 && <p className="muted">Cuando un cliente toque “Llamar al mesero” aparecerá aquí con su número de mesa.</p>}

      <div className="calls">
        {pending.map((c) => (
          <div className="call" key={c.id}>
            <div>
              <div className="mesa-big">Mesa {c.table_label}</div>
              <small className="muted">{ago(c.created_at)}</small>
            </div>
            <button onClick={() => answer(c.id)}>Voy para allá</button>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <h2 style={{ marginTop: 28 }}>Atendidas</h2>
          <div className="calls">
            {done.slice(0, 10).map((c) => (
              <div className="call done" key={c.id}>
                <span>Mesa {c.table_label}</span>
                <small className="muted">{ago(c.created_at)}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
