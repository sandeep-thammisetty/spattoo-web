import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spattoo — 3D Cake Designer for Bakers",
    short_name: "Spattoo",
    description:
      "Let your customers design custom cakes online, confirm orders instantly, and manage everything in one place.",
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
