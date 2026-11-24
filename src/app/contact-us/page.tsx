import type { Metadata } from 'next';

import { createSeoMetadata } from 'src/lib/seo';

import { ContactView } from 'src/sections/contact/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = createSeoMetadata({
  title: 'ติดต่อเรา | Loveza Hunt',
  description:
    'ติดต่อทีม Loveza Hunt เพื่อสอบถามข้อมูล แจ้งปัญหา หรือเสนอแนะเกี่ยวกับระบบค้นหาร้าน Loveza',
  path: '/contact-us/',
});

export default async function Page({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return <ContactView initialSubject={topic === 'advertising' ? 'ติดต่อลงโฆษณา' : ''} />;
}
