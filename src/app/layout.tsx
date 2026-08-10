import 'src/global.css';

import type { Metadata, Viewport } from 'next';
import type { CookieConsentValue } from 'src/components/cookie-consent';

import { cookies } from 'next/headers';
import { Prompt } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

import { CONFIG } from 'src/global-config';
import { LocalizationProvider } from 'src/locales';
import { detectLanguage } from 'src/locales/server';
import { createClient } from 'src/lib/supabase/server';
import { I18nProvider } from 'src/locales/i18n-provider';
import { isSiteFont, DEFAULT_SITE_FONT } from 'src/lib/site-font';
import { QueryProvider } from 'src/lib/react-query/query-provider';
import { themeConfig, ThemeProvider, primary as primaryColor } from 'src/theme';
import {
  SITE_URL,
  SITE_NAME,
  OG_IMAGE_URL,
  SITE_DESCRIPTION,
  createSeoMetadata,
  BRAND_ASSET_VERSION,
  SITE_ALTERNATE_NAME,
} from 'src/lib/seo';

import { Snackbar } from 'src/components/snackbar';
import { LocatorJS } from 'src/components/locator-js';
import { ProgressBar } from 'src/components/progress-bar';
import { CookieConsent } from 'src/components/cookie-consent';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { detectSettings } from 'src/components/settings/server';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider as JwtAuthProvider } from 'src/auth/context/jwt';
import { AuthProvider as Auth0AuthProvider } from 'src/auth/context/auth0';
import { AuthProvider as AmplifyAuthProvider } from 'src/auth/context/amplify';
import { AuthProvider as SupabaseAuthProvider } from 'src/auth/context/supabase';
import { AuthProvider as FirebaseAuthProvider } from 'src/auth/context/firebase';

// ----------------------------------------------------------------------

const AuthProvider =
  (CONFIG.auth.method === 'amplify' && AmplifyAuthProvider) ||
  (CONFIG.auth.method === 'firebase' && FirebaseAuthProvider) ||
  (CONFIG.auth.method === 'supabase' && SupabaseAuthProvider) ||
  (CONFIG.auth.method === 'auth0' && Auth0AuthProvider) ||
  JwtAuthProvider;

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.BING_SITE_VERIFICATION;

const promptFont = Prompt({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-prompt',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: primaryColor.main,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...createSeoMetadata({
    title: 'Loveza Hunt — ตามหาร้าน Loveza ใกล้คุณ',
    description: SITE_DESCRIPTION,
    path: '/',
  }),
  applicationName: SITE_NAME,
  manifest: '/manifest.webmanifest',
  keywords: [
    'Loveza',
    'Loveza Hunt',
    'LovezaHunt',
    'lovezahunt',
    'Loveza ใกล้ฉัน',
    'ร้านขาย Loveza',
    'พิกัด Loveza',
    'เลิฟซ่า',
    'น้ำดื่มโซดาผสมวิตามิน',
    'น้ำโซดาวิตามิน B3 B6 B12',
  ],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'food and drink',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  verification:
    googleSiteVerification || bingSiteVerification
      ? {
          ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
          ...(bingSiteVerification ? { other: { 'msvalidate.01': bingSiteVerification } } : {}),
        }
      : undefined,
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        sizes: '16x16 32x32 48x48',
        url: `${CONFIG.assetsDir}/favicon.ico?v=${BRAND_ASSET_VERSION}`,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: `${CONFIG.assetsDir}/icons/icon-192.png?v=${BRAND_ASSET_VERSION}`,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: `${CONFIG.assetsDir}/icons/icon-512.png?v=${BRAND_ASSET_VERSION}`,
      },
    ],
    shortcut: `${CONFIG.assetsDir}/favicon.ico?v=${BRAND_ASSET_VERSION}`,
    apple: [
      {
        type: 'image/png',
        sizes: '180x180',
        url: `${CONFIG.assetsDir}/apple-touch-icon.png?v=${BRAND_ASSET_VERSION}`,
      },
    ],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'th-TH',
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#application`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      image: OG_IMAGE_URL,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Any',
      inLanguage: 'th-TH',
    },
  ],
};

// ----------------------------------------------------------------------

type RootLayoutProps = {
  children: React.ReactNode;
};

async function getAppConfig() {
  if (CONFIG.isStaticExport) {
    const siteFont = DEFAULT_SITE_FONT;
    const fontFamily = themeConfig.fontFamily.primary;
    const appDefaultSettings = {
      ...defaultSettings,
      fontFamily,
      version: `${defaultSettings.version}-${siteFont}`,
    };

    return {
      lang: 'en',
      i18nLang: undefined,
      cookieSettings: undefined,
      dir: defaultSettings.direction,
      cookieConsent: null,
      siteFont,
      fontFamily,
      appDefaultSettings,
    };
  } else {
    const supabase = await createClient();
    const [lang, settings, cookieStore, siteFontResult] = await Promise.all([
      detectLanguage(),
      detectSettings(),
      cookies(),
      supabase.rpc('get_site_font'),
    ]);

    const consent = cookieStore.get('loveza_cookie_consent')?.value;
    const cookieConsent: CookieConsentValue | null =
      consent === 'all' || consent === 'necessary' ? consent : null;
    const siteFont = isSiteFont(siteFontResult.data) ? siteFontResult.data : DEFAULT_SITE_FONT;
    const fontFamily =
      siteFont === 'prompt' ? promptFont.style.fontFamily : themeConfig.fontFamily.primary;
    const appDefaultSettings = {
      ...defaultSettings,
      fontFamily,
      version: `${defaultSettings.version}-${siteFont}`,
    };
    const cookieSettings = {
      ...settings,
      fontFamily,
      version: appDefaultSettings.version,
    };

    return {
      lang,
      i18nLang: lang,
      cookieSettings,
      dir: settings.direction,
      cookieConsent,
      siteFont,
      fontFamily,
      appDefaultSettings,
    };
  }
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const appConfig = await getAppConfig();

  return (
    <html
      lang={appConfig.lang}
      dir={appConfig.dir}
      className={promptFont.variable}
      suppressHydrationWarning
    >
      <body style={{ fontFamily: appConfig.fontFamily }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
          }}
        />
        <InitColorSchemeScript
          modeStorageKey={themeConfig.modeStorageKey}
          attribute={themeConfig.cssVariables.colorSchemeSelector}
          defaultMode={themeConfig.defaultMode}
        />

        <I18nProvider lang={appConfig.i18nLang}>
          <AuthProvider>
            <SettingsProvider
              key={appConfig.siteFont}
              defaultSettings={appConfig.appDefaultSettings}
              cookieSettings={appConfig.cookieSettings}
            >
              <LocalizationProvider>
                <AppRouterCacheProvider options={{ key: 'css' }}>
                  <ThemeProvider
                    modeStorageKey={themeConfig.modeStorageKey}
                    defaultMode={themeConfig.defaultMode}
                  >
                    <MotionLazy>
                      <LocatorJS />
                      <Snackbar />
                      <ProgressBar />
                      <SettingsDrawer defaultSettings={appConfig.appDefaultSettings} />
                      <QueryProvider>{children}</QueryProvider>
                      <CookieConsent initialConsent={appConfig.cookieConsent ?? null} />
                    </MotionLazy>
                  </ThemeProvider>
                </AppRouterCacheProvider>
              </LocalizationProvider>
            </SettingsProvider>
          </AuthProvider>
        </I18nProvider>
        {appConfig.cookieConsent === 'all' ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
