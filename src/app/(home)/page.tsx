import type { Metadata } from 'next';

import { HomeView } from 'src/sections/home/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Loveza Near Me — ตามหาร้าน Loveza ใกล้คุณ',
  description:
    'ค้นหาร้านที่มี Loveza ใกล้คุณด้วย GPS ดูสถานะสินค้า และช่วยแจ้งพิกัดที่พบผ่านข้อมูลจาก Community',
};

export default function Page() {
  return <HomeView />;
}
