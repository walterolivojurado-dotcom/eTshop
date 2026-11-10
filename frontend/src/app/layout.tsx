import { ClientProviders } from "@/components/providers/ClientProviders";
import "./globals.css";

export const metadata = {
  title: "eTshop — Sistema POS & Gestión de Inventarios",
  description: "Plataforma Multi-Tenant de Punto de Venta, Inventario y Ventas para comercios locales",
  icons: {
    icon: [{ url: "/api/settings/favicon" }],
    shortcut: [{ url: "/api/settings/favicon" }],
    apple: [{ url: "/api/settings/favicon" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "eTshop",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased font-outfit" suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
