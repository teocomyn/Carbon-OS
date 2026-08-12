import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: "2026-08-12",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/methodologie`,
      lastModified: "2026-08-12",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/confidentialite`,
      lastModified: "2026-08-12",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/mentions-legales`,
      lastModified: "2026-08-12",
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
