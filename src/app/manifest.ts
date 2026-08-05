import type { MetadataRoute } from 'next';

import { CONFIG } from 'src/global-config';
import { primaryColor } from 'src/theme/palette';

// ----------------------------------------------------------------------

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: CONFIG.appName,
    short_name: CONFIG.appShortName,
    description: 'ค้นหาและช่วยแจ้งพิกัดร้านที่พบเครื่องดื่ม Loveza ใกล้คุณ',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF7FF',
    theme_color: primaryColor,
    lang: 'th',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
