import Link from "next/link";

// Brand mark: a serving cloche (food dome) on a burgundy badge, gold accents.
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Restaurant Demo" fill="none">
      <circle cx="32" cy="32" r="30.5" fill="#7b1e2b" stroke="#c8963e" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="26" stroke="#c8963e" strokeOpacity=".35" strokeWidth="0.8" />
      <path d="M14 39a18 18 0 0 1 36 0H14Z" fill="#fbf5ee" />
      <path d="M19 35.5a13 13 0 0 1 8-9.6" stroke="#7b1e2b" strokeOpacity=".25" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="32" cy="19.4" r="2.4" fill="#c8963e" />
      <rect x="10.5" y="39.8" width="43" height="3.2" rx="1.6" fill="#c8963e" />
      <path d="M22 47.5h20" stroke="#c8963e" strokeOpacity=".6" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M46 14.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z" fill="#e7c37a" />
      <path d="M16.5 17l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6.6-1.5Z" fill="#e7c37a" />
    </svg>
  );
}

export default function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={light ? "brand light" : "brand"}>
      <LogoMark />
      <span className="brand-text">
        <span className="brand-name">Restaurant</span>
        <span className="brand-sub">Demo</span>
      </span>
    </Link>
  );
}
