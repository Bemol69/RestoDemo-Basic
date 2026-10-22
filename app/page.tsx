import { headers } from "next/headers";
import { networkInterfaces } from "node:os";
import Link from "next/link";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

// Entry screen: a QR that opens the menu. On localhost we use the PC's LAN address
// so a phone on the same Wi-Fi can actually open it.
function lanIp() {
  for (const list of Object.values(networkInterfaces())) {
    for (const n of list ?? []) if (n.family === "IPv4" && !n.internal) return n.address;
  }
  return null;
}

export default async function Home() {
  const h = await headers();
  let host = process.env.PUBLIC_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const local = /localhost|127\.0\.0\.1/.test(host);
  const ip = local ? lanIp() : null;
  if (ip) host = host.replace(/localhost|127\.0\.0\.1/, ip);

  const tables = Array.from({ length: 8 }, (_, i) => i + 1);
  const make = (url: string) => QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#1f5c46" } });
  const main = `${host}/r/demo`;
  const svg = await make(main);
  const perTable = await Promise.all(tables.map(async (n) => ({ n, url: `${main}?mesa=${n}`, svg: await make(`${main}?mesa=${n}`) })));

  return (
    <div className="wrap home">
      <p className="eyebrow">La Mesa de Ana</p>
      <h1>Escanea para ver la carta</h1>
      <p className="muted">Abre la carta en tu celular y llama al mesero cuando lo necesites.</p>
      <div className="qr-big" dangerouslySetInnerHTML={{ __html: svg }} />
      <p><a className="btn" href={main}>Abrir la carta</a></p>
      <p className="muted" style={{ fontSize: ".85rem" }}>{main}</p>
      {ip && <p className="muted" style={{ fontSize: ".85rem" }}>Este QR usa la IP de tu PC ({ip}): el celular debe estar en el mismo Wi-Fi.</p>}

      <details className="noprint" style={{ marginTop: 28, textAlign: "left" }}>
        <summary>QR por mesa (para imprimir, ya llevan el número de mesa)</summary>
        <div className="qrgrid" style={{ marginTop: 14 }}>
          {perTable.map((t) => (
            <div className="qrcard" key={t.n}>
              <div dangerouslySetInnerHTML={{ __html: t.svg }} />
              <strong>Mesa {t.n}</strong>
            </div>
          ))}
        </div>
      </details>

      <p style={{ marginTop: 40 }}><Link className="muted" href="/admin">Soy mesero →</Link></p>
    </div>
  );
}
