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
  title: { default: "LifeMode — Make your days mean something", template: "%s | LifeMode" },
  description: "A considered space for your goals, plans, progress and the people who move you forward. Build your LifeMode, one intentional day at a time.",
  applicationName: "LifeMode",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://lifemode.vercel.app",
    siteName: "LifeMode",
    title: "LifeMode — Make your days mean something",
    description: "A considered space for your goals, plans, progress and the people who move you forward.",
  },
  twitter: {
    card: "summary",
    title: "LifeMode — Make your days mean something",
    description: "A considered space for your goals, plans and progress.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
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
