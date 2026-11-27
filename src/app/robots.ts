import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/planning", "/goals", "/proof", "/connections", "/discover", "/stories", "/play", "/buddy", "/profile", "/settings", "/subscription", "/opportunities", "/api/"] },
    ],
    sitemap: "https://lifemode.vercel.app/sitemap.xml",
    host: "https://lifemode.vercel.app",
  };
}
