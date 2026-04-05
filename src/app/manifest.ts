import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Accepted",
    short_name: "Accepted",
    description: "CCF computer science deadline tracker and submission planning workspace.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f4ee",
    theme_color: "#0f4fa8",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
