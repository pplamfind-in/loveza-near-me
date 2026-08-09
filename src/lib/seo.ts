import type { Metadata } from 'next';

export const SITE_NAME = 'Loveza Hunt';
export const BRAND_ASSET_VERSION = 'loveza-hunt-20260809';
export const SITE_DESCRIPTION =
  'ค้นหาร้านที่มี Loveza ใกล้คุณด้วย GPS ดูสถานะและจำนวนสินค้า พร้อมช่วยแจ้งพิกัดให้ Community ตามไปซื้อได้ง่ายขึ้น';
export const OG_IMAGE_URL =
  'https://res.cloudinary.com/dkdbilwtj/image/upload/v1786288069/ChatGPT_Image_Aug_9_2026_10_07_20_PM_zyotz2.png';

const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_SERVER_URL ??
  (productionDomain ? `https://${productionDomain}` : 'http://localhost:3300');

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
    alternates: { canonical: path },
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
          width: 1536,
          height: 1024,
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
