import webpush from "web-push";
import { query, run } from "./db";

// Web Push (Android Chrome and other browsers). Needs VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT
// (a mailto: address) in the environment; without them push is simply turned off.
export const pushEnabled = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function setup() {
  if (configured || !pushEnabled()) return pushEnabled();
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
  return true;
}

type Sub = { id: number; endpoint: string; p256dh: string; auth: string };

/** Sends a notification to every phone subscribed for this restaurant. Never throws. */
export async function notifyStaff(restaurantId: number, payload: { title: string; body: string; tag: string; url?: string }) {
  if (!setup()) return { sent: 0, failed: 0, enabled: false };
  const subs = await query<Sub>("SELECT id, endpoint, p256dh, auth FROM push_subs WHERE restaurant_id = ?", [restaurantId]);
  let sent = 0;
  let failed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 120, urgency: "high" });
        sent++;
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number }).statusCode;
        // 404/410: the phone unsubscribed or reinstalled; forget it.
        if (code === 404 || code === 410) await run("DELETE FROM push_subs WHERE id = ?", [s.id]);
      }
    }),
  );
  return { sent, failed, enabled: true };
}
