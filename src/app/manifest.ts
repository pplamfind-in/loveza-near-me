import type { MetadataRoute } from 'next';

import { SITE_NAME, SITE_DESCRIPTION } from 'src/lib/seo';

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
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
