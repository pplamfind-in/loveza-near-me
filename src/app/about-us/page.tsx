import type { Metadata } from 'next';

import { createSeoMetadata } from 'src/lib/seo';

import { AboutView } from 'src/sections/about/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = createSeoMetadata({
  title: 'เรื่องของเรา | Loveza Near Me',
  description:
    'รู้จัก Loveza Near Me ระบบ Community ที่ช่วยกันแจ้งพิกัดร้าน สถานะสินค้า และตามหา Loveza ใกล้ตัวได้ง่ายขึ้น',
  path: '/about-us/',
});

export default function Page() {
  return <AboutView />;
}
