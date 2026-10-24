import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ThemeRuntime } from "@/components/theme-runtime";
import { MotionField } from "@/components/motion-field";
import { SiteFooter } from "@/components/site-footer";
import Script from "next/script";

const themeBootstrap = `(() => {
  try {
    const stored = localStorage.getItem("lifemode-theme");
    const preference = stored === "light" || stored === "dark" ? stored : "system";
    const isDark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  } catch {
    document.documentElement.dataset.themePreference = "system";
    document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
})();`;

export const metadata: Metadata = {
  title: "LifeMode",
  description: "Build your life, prove your progress, and find your people.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LifeMode",
  },
};

export const viewport: Viewport = {
  themeColor: "#181713",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script id="lifemode-theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
        {children}
        <SiteFooter />
        <ThemeRuntime />
        <MotionField />
        <ScrollReveal />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
