import type { MetadataRoute } from "next";
import { getWeddingDate, formatLongDate } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const longDate = formatLongDate(await getWeddingDate());
  return {
    name: "Blessing & Justice — #OfoDiMma",
    short_name: "OfoDiMma",
    description: `Blessing & Justice's wedding invitation. ${longDate} · Acropolis Park, Apo. #OfoDiMma`,
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
