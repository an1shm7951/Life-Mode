import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/onboarding",
          "/dashboard",
          "/planning",
          "/goals",
          "/proof",
          "/connections",
          "/discover",
          "/stories",
          "/play",
          "/buddy",
          "/profile",
          "/settings",
          "/subscription",
          "/opportunities",
          "/schedule",
          "/plus",
        ],
      },
    ],
    sitemap: "https://lifemode.vercel.app/sitemap.xml",
    host: "https://lifemode.vercel.app",
  };
}
