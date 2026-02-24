import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { ServiceWorkerProvider } from '@/components/providers/service-worker-provider';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { UpdatePrompt } from '@/components/pwa/update-prompt';
import './globals.css';
import './styles/article-content.css';
import { APP_NAME } from '@/lib/utils/constants';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Piattaforma digitale per la community del Comitato di Quartiere Prato Rinaldo',
  keywords: ['community', 'prato rinaldo', 'san cesareo', 'zagarolo', 'quartiere'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0891b2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-72x72.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans antialiased">
        <ServiceWorkerProvider>
          {children}
          <UpdatePrompt />
          <InstallPrompt dismissDays={7} />
        </ServiceWorkerProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
