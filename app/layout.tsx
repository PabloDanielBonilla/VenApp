import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/app-layout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FrescoGuard - Control de Vencimientos",
  description: "Nunca más dejes que tus alimentos se echen a perder. Detecta fechas de vencimiento con IA, recibe notificaciones inteligentes y descubre recetas deliciosas.",
  keywords: ["alimentos", "vencimiento", "notificaciones", "recetas", "IA", "OCR", "despensa"],
  authors: [{ name: "FrescoGuard Team" }],
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Frescoguard",
  },
  openGraph: {
    title: "Frescoguard - Control de Vencimientos con IA",
    description: "Detecta fechas de vencimiento, recibe notificaciones y descubre recetas con IA",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Extiende el contenido hasta los bordes en Android
  themeColor: "#0B0B0B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.svg" />
        <meta name="theme-color" content="#0B0B0B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} antialiased bg-[#0B0B0B] text-white h-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppLayout>{children}</AppLayout>
          <Toaster />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}

// Componente para registrar el Service Worker
function ServiceWorkerRegistration() {
  if (typeof window !== 'undefined') {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('Service Worker registrado:', registration.scope)
          })
          .catch((error) => {
            console.error('Error registrando Service Worker:', error)
          })
      })
    }
  }
  return null
}
