import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./launch.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { GlobalMotion } from "@/components/global-motion";
import { ThemeRuntime } from "@/components/theme-runtime";
import { SiteFooter } from "@/components/site-footer";
import Script from "next/script";

const themeBootstrap = `(() => {
  try {
    const stored = localStorage.getItem("lifemode-theme");
    const preference = stored === "light" || stored === "dark" ? stored : "dark";
    const isDark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  } catch {
    document.documentElement.dataset.themePreference = "system";
    document.documentElement.dataset.theme = "dark";
  }
})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://lifemode.vercel.app"),
  title: {
    default: "LifeMode — Your Personal Operating System",
    template: "%s | LifeMode",
  },
  description:
    "LifeMode is an AI-assisted personal operating system for bringing goals, plans, progress and personal growth into one considered space.",
  applicationName: "LifeMode",
  category: "productivity",
  openGraph: {
    type: "website",
    siteName: "LifeMode",
    title: "LifeMode — Your Personal Operating System",
    description:
      "Bring your goals, plans, progress and personal growth into one considered space with LifeMode.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LifeMode — Your Personal Operating System",
    description:
      "An AI-assisted personal operating system for goals, plans, progress and personal growth.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/lifemode-icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "LifeMode" },
};

export const viewport: Viewport = { themeColor: "#080807" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script id="lifemode-theme-bootstrap" strategy="beforeInteractive">{themeBootstrap}</Script>
        <GlobalMotion>{children}</GlobalMotion>
        <SiteFooter />
        <ThemeRuntime />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
