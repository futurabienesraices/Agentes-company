import type { Metadata, Viewport } from "next";
import MobileShell from "./components/MobileShell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Futura OS", template: "%s · Futura OS" },
  description: "Sistema operativo de crecimiento y CRM para Futura Bienes Raíces",
  applicationName: "Futura OS",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Futura OS",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {children}
        <MobileShell />
      </body>
    </html>
  );
}
