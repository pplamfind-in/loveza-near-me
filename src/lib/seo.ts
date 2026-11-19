import type { Metadata } from 'next';

export const SITE_NAME = 'Loveza Hunt';
export const SITE_ALTERNATE_NAME = 'LovezaHunt';
export const SITE_TITLE = 'Love Za (เลิฟซ่า) ซื้อที่ไหน? แผนที่ร้านใกล้คุณ | Loveza Hunt';
export const BRAND_ASSET_VERSION = 'loveza-hunt-20261119';
export const SITE_DESCRIPTION =
  'ค้นหาร้านขาย Love Za (เลิฟซ่า) ใกล้คุณด้วยแผนที่ Loveza Hunt ดูพิกัดร้าน รสชาติ และสถานะสินค้าล่าสุดจากชุมชน หรือแจ้งพิกัดร้านที่คุณพบ';
export const OG_IMAGE_URL =
  'https://res.cloudinary.com/dkdbilwtj/image/upload/v1794944774/og-image_uqyxkr.png';

const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_SERVER_URL ??
  (productionDomain ? `https://${productionDomain}` : 'https://lovezahunt.xyz');

export const SITE_URL = configuredSiteUrl.replace(/\/$/, '');

export const NO_INDEX_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export const PUBLIC_SEO_ROUTES = [
  { path: '/', changeFrequency: 'daily' as const, priority: 1 },
  { path: '/nearby/', changeFrequency: 'hourly' as const, priority: 0.9 },
  { path: '/mapza/', changeFrequency: 'hourly' as const, priority: 0.9 },
  { path: '/about-us/', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/contact-us/', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/terms/', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/privacy/', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/cookies/', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/community-guidelines/', changeFrequency: 'yearly' as const, priority: 0.3 },
];

export function absoluteUrl(path: string) {
  return new URL(path, `${SITE_URL}/`).toString();
}

type CreateSeoMetadataOptions = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createSeoMetadata({
  title,
  description,
  path,
  noIndex = false,
}: CreateSeoMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path, languages: { 'th-TH': path } },
    robots: noIndex ? NO_INDEX_ROBOTS : undefined,
    openGraph: {
      type: 'website',
      locale: 'th_TH',
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: OG_IMAGE_URL,
          width: 2683,
          height: 1404,
          alt: 'Loveza Hunt ค้นหาร้าน Loveza ใกล้คุณ',
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE_URL],
    },
  };
}
