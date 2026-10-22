import type { MetadataRoute } from "next";

// Lets the waiter install the panel on their phone's home screen ("Add to home screen").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Restaurant Demo · Mesero",
    short_name: "Mesero",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#fbf5ee",
    theme_color: "#7b1e2b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
