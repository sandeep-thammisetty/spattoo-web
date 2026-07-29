import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spattoo",
    short_name: "Spattoo",
    description: "Design your cake, request a quote.",
    start_url: "/",
    display: "standalone",
    background_color: "#edeae3",
    theme_color: "#3a4f46",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
