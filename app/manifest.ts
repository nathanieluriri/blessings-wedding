import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Blessing & Justice — #OfoDiMma",
    short_name: "OfoDiMma",
    description:
      "Blessing & Justice's wedding invitation. 19 December 2026 · Acropolis Park, Apo. #OfoDiMma",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6f0",
    theme_color: "#5a1a1a",
    orientation: "portrait",
    categories: ["lifestyle", "events"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
