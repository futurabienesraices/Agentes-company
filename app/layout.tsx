import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Futura Agentes",
  description: "Centro de automatización de agentes para Futura Bienes Raíces"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
