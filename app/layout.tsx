import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { RatesProvider } from '@/context/RatesContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Kushal Jewellerys | Retail POS & Inventory Management',
  description: 'Fast Point of Sale Billing, Real-time Silver Rate Engine, Stock Control & Khata CRM for Silver Jewellery Stores',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logochanged.jpg', type: 'image/jpeg' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/logochanged.jpg'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/logochanged.jpg' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logochanged.jpg" type="image/jpeg" sizes="any" />
        <link rel="shortcut icon" href="/logochanged.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/logochanged.jpg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kushal Jewellerys" />
        <meta name="application-name" content="Kushal Jewellerys" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8F9FA] text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
        <AuthProvider>
          <RatesProvider>
            <AppShell>{children}</AppShell>
          </RatesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
