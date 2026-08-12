import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carbon OS — Tableau de bord carbone personnel",
    short_name: "Carbon OS",
    description:
      "Mesurez, comprenez et réduisez votre empreinte carbone personnelle.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0c0f",
    theme_color: "#7568ff",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
