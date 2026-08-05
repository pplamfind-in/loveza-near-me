import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { MobileHeader } from 'src/components/layout/mobile-header';
import { MobileAppShell } from 'src/components/layout/mobile-app-shell';

import { LatestContent } from './latest-content';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `พิกัดล่าสุด | ${CONFIG.appName}` };

export default function LatestPage() {
  return (
    <MobileAppShell>
      <MobileHeader title="พิกัดล่าสุด" />
      <LatestContent />
    </MobileAppShell>
  );
}
