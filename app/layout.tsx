import type { Metadata, Viewport } from "next";
import MobileShell from "./components/MobileShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Futura CRM",
  description: "Centro de operaciones para Futura Bienes Raíces",
  applicationName: "Futura CRM",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Futura CRM",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d1d1f",
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
