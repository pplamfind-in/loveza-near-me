import type { ReactNode } from 'react';

import { LovezaMainLayout } from 'src/layouts/main/loveza-layout';

export default function AnnouncementsLayout({ children }: { children: ReactNode }) {
  return <LovezaMainLayout>{children}</LovezaMainLayout>;
}
