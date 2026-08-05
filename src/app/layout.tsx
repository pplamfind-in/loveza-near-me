import 'src/global.css';

import type { Metadata, Viewport } from 'next';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

import { CONFIG } from 'src/global-config';
import { ThemeProvider } from 'src/theme';
import { primaryColor } from 'src/theme/palette';

import { ServiceWorkerRegister } from 'src/components/layout/service-worker-register';

// ----------------------------------------------------------------------

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: primaryColor,
};

export const metadata: Metadata = {
  title: {
    default: 'ตามหา Loveza ใกล้คุณ',
    template: '%s | ตามหา Loveza',
  },
  description: 'ค้นหาและช่วยแจ้งพิกัดร้านที่พบเครื่องดื่ม Loveza ใกล้คุณ',
  applicationName: CONFIG.appName,
  openGraph: {
    title: 'ตามหา Loveza ใกล้คุณ',
    description: 'ค้นหาและช่วยแจ้งพิกัดร้านที่พบเครื่องดื่ม Loveza ใกล้คุณ',
    siteName: CONFIG.appName,
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'ตามหา Loveza ใกล้คุณ',
    description: 'ค้นหาและช่วยแจ้งพิกัดร้านที่พบเครื่องดื่ม Loveza ใกล้คุณ',
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeProvider>
            <ServiceWorkerRegister />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
