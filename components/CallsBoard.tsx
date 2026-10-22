"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { answerCall } from "@/app/admin/actions";
import type { Call } from "@/lib/db";
import PushPanel from "@/components/PushPanel";

const POLL_MS = 3000;

function beep() {
  try {
    const ctx = new AudioContext();
    [880, 1175, 880].forEach((f, n) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = f;
      const t = ctx.currentTime + n * 0.25;
      g.gain.setValueAtTime(0.3, t);
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
  const [live, setLive] = useState(true);
  const [, tick] = useState(0);
  const maxId = useRef<number | null>(null);
  const baseTitle = useRef("");
  const lastOk = useRef(Date.now());
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current) return; // never stack requests on a slow connection
    busy.current = true;
    try {
      const res = await fetch("/api/admin/calls", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/login"; // session expired
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data: { calls: Call[] } = await res.json();
      lastOk.current = Date.now();
      setLive(true);

      const pending = data.calls.filter((c) => c.status === "pendiente");
      const newest = data.calls.reduce((m, c) => Math.max(m, c.id), 0);
      if (maxId.current !== null && newest > maxId.current) {
        beep();
        navigator.vibrate?.([300, 100, 300]);
        const fresh = pending.filter((c) => c.id > (maxId.current ?? 0));
        if ("Notification" in window && Notification.permission === "granted") {
          fresh.forEach((c) => new Notification(`🔔 Mesa ${c.table_label} te llama`, { body: "Un cliente necesita al mesero.", tag: `call-${c.id}` }));
        }
      }
      maxId.current = Math.max(maxId.current ?? 0, newest);
      document.title = pending.length ? `(${pending.length}) Mesa ${pending[pending.length - 1].table_label} llama` : baseTitle.current;
      setCalls(data.calls);
      setLoaded(true);
    } catch {
      if (Date.now() - lastOk.current > 9000) setLive(false);
    } finally {
      busy.current = false;
    }
  }, []);

  // Constant refresh. A Web Worker keeps the timer running even when the tab is in the
  // background (browsers throttle normal timers there); we also refresh the moment the
  // tab is shown again or the connection comes back.
  useEffect(() => {
    baseTitle.current = document.title;
    load();

    let worker: Worker | null = null;
    let fallback: ReturnType<typeof setInterval> | null = null;
    try {
      const src = `setInterval(() => postMessage(0), ${POLL_MS});`;
      const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
      worker = new Worker(url);
      worker.onmessage = () => load();
    } catch {
      fallback = setInterval(load, POLL_MS);
    }
    const clock = setInterval(() => tick((n) => n + 1), 1000);

    // Keep the screen on while this page is open (so the phone/PC does not fall asleep).
    let lock: WakeLockSentinel | null = null;
    const keepAwake = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {}
    };
    keepAwake();

    const wake = () => {
      if (document.visibilityState === "visible") {
        load();
        keepAwake();
      }
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", load);
    window.addEventListener("online", load);

    return () => {
      worker?.terminate();
      if (fallback) clearInterval(fallback);
      clearInterval(clock);
      lock?.release().catch(() => {});
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", load);
      window.removeEventListener("online", load);
    };
  }, [load]);

  async function answer(id: number) {
    setCalls((cs) => cs.map((c) => (c.id === id ? { ...c, status: "atendido" } : c)));
    await answerCall(id);
    load();
  }

  const pending = calls.filter((c) => c.status === "pendiente").reverse();
  const done = calls.filter((c) => c.status !== "pendiente");

  return (
    <>
      <div className="page-title">
        <h1>{pending.length ? `${pending.length} mesa${pending.length > 1 ? "s" : ""} llamando` : "Todo tranquilo"}</h1>
        <span className={live ? "live on" : "live off"}>{live ? "● En vivo" : "● Sin conexión, reintentando…"}</span>
      </div>
      <p className="muted">Esta pantalla se actualiza sola. No necesitas recargar.</p>

      <PushPanel unlockSound={beep} />

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
