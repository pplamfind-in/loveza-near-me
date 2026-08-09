import type { MetadataRoute } from 'next';

import { SITE_NAME, SITE_DESCRIPTION, BRAND_ASSET_VERSION } from 'src/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ตามหาร้าน Loveza ใกล้คุณ`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#fffafd',
    theme_color: '#E5007E',
    lang: 'th',
    icons: [
      {
        src: `/favicon.ico?v=${BRAND_ASSET_VERSION}`,
        sizes: '16x16 32x32 48x48',
        type: 'image/x-icon',
      },
    ],
  };
}
