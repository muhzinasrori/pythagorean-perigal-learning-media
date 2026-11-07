import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Generates /sitemap.xml.
 *
 * The learning app is a single-page application on `/`, so the sitemap lists
 * the canonical home URL. The /teacher dashboard is intentionally excluded
 * (it is noindexed). Add future public routes (blog, module pages) here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
