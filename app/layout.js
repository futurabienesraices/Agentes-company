import './globals.css';

export const metadata = {
  title: 'Futura Agentes',
  description: 'Centro de operaciones de agentes para Futura Bienes Raíces',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
