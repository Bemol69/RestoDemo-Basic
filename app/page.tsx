import { headers } from "next/headers";
import { networkInterfaces } from "node:os";
import Link from "next/link";
import QRCode from "qrcode";
import Logo from "@/components/Logo";
import { query, type Item, type Restaurant, RESTAURANT_COLS } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

// On localhost the QR uses the PC's LAN address so a phone on the same Wi-Fi can open it.
function lanIp() {
  for (const list of Object.values(networkInterfaces())) {
    for (const n of list ?? []) if (n.family === "IPv4" && !n.internal) return n.address;
  }
  return null;
}

const STEPS = [
  ["Escanea el QR", "Cada mesa tiene su código. Apunta la cámara de tu celular y se abre la carta."],
  ["Mira la carta", "Fotos, descripciones y precios de todos nuestros platos, sin instalar nada."],
  ["Llama al mesero", "Toca el botón, escribe tu número de mesa y te avisamos al instante."],
] as const;

export default async function Home() {
  const [r] = await query<Restaurant>(`SELECT ${RESTAURANT_COLS} FROM restaurants ORDER BY id LIMIT 1`);
  const items = r
    ? await query<Item>("SELECT * FROM items WHERE restaurant_id = ? AND available = 1 AND image_url != '' ORDER BY position, id LIMIT 4", [r.id])
    : [];

  const h = await headers();
  let host = process.env.PUBLIC_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const ip = /localhost|127\.0\.0\.1/.test(host) ? lanIp() : null;
  if (ip) host = host.replace(/localhost|127\.0\.0\.1/, ip);

  const menuUrl = r ? `${host}/r/${r.slug}` : host;
  const make = (url: string) => QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#4e111b" } });
  const svg = await make(menuUrl);
  const tables = await Promise.all(
    Array.from({ length: r?.tables_count ?? 8 }, async (_, i) => ({ n: i + 1, svg: await make(`${menuUrl}?mesa=${i + 1}`) })),
  );

  return (
    <>
      <header className="site-head">
        <div className="wrap">
          <Logo />
          <nav className="site-nav">
            <a href="#favoritos">Favoritos</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#qr">Código QR</a>
            <Link className="btn" href={r ? `/r/${r.slug}` : "#"}>Ver la carta</Link>
          </nav>
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <div>
            <p className="eyebrow">Cocina colombiana</p>
            <h1>Sabores de casa, <em>servidos con cariño</em></h1>
            <p className="lead">Mira la carta desde tu mesa, elige tu plato favorito y llama al mesero con un toque. Sin filas, sin esperas.</p>
            <div className="hero-cta">
              <Link className="btn" href={r ? `/r/${r.slug}` : "#"}>Ver la carta</Link>
              <a className="btn ghost" href="#qr">Escanear QR</a>
            </div>
          </div>
          <div className="hero-art">
            {items[0] && <img className="plate" src={items[0].image_url} alt={items[0].name} />}
            <div className="float-card"><span className="ico">🔔</span>Llama al mesero<br />desde tu mesa</div>
          </div>
        </section>

        {items.length > 0 && r && (
          <section className="section" id="favoritos">
            <div className="section-head">
              <p className="eyebrow">De la casa</p>
              <h2>Nuestros favoritos</h2>
              <p className="muted">Los platos que más piden nuestros clientes.</p>
            </div>
            <div className="favs">
              {items.map((i) => (
                <Link className="fav" href={`/r/${r.slug}`} key={i.id}>
                  <img src={i.image_url} alt={i.name} loading="lazy" />
                  <div>
                    <h3>{i.name}</h3>
                    <p className="muted clamp">{i.description}</p>
                    <strong>{formatMoney(i.price_cents, r.currency)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section" id="como-funciona">
          <div className="section-head">
            <p className="eyebrow">Muy fácil</p>
            <h2>Así de simple</h2>
          </div>
          <div className="steps3">
            {STEPS.map(([t, d], n) => (
              <div className="step3" key={t}>
                <div className="num">{n + 1}</div>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="qr">
          <div className="qr-band">
            <div>
              <p className="eyebrow">Tu mesa, tu celular</p>
              <h2>Escanea y abre la carta</h2>
              <p>Apunta la cámara al código. Si estás en una mesa, ya sabremos cuál es.</p>
              <Link className="btn gold" href={menuUrl}>Abrir la carta</Link>
              {ip && <p style={{ fontSize: ".8rem", marginTop: 14 }}>Modo local: el celular debe estar en el mismo Wi-Fi ({ip}).</p>}
              <details className="noprint">
                <summary>QR por mesa (para imprimir)</summary>
                <div className="qrgrid">
                  {tables.map((t) => (
                    <div className="qrcard" key={t.n}>
                      <div dangerouslySetInnerHTML={{ __html: t.svg }} />
                      <strong>Mesa {t.n}</strong>
                    </div>
                  ))}
                </div>
              </details>
            </div>
            <div className="qr-big" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <div className="wrap">
          <Logo />
          <span className="muted">Restaurant Demo · proyecto de demostración</span>
          <Link className="muted" href="/admin">Acceso del personal</Link>
        </div>
      </footer>
    </>
  );
}
