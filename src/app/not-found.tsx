import type { Metadata } from 'next';

import Button from '@mui/material/Button';

import { CONFIG } from 'src/global-config';

import { EmptyState } from 'src/components/common/empty-state';
import { MobileAppShell } from 'src/components/layout/mobile-app-shell';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `ไม่พบหน้านี้ | ${CONFIG.appName}` };

export default function NotFound() {
  return (
    <MobileAppShell>
      <EmptyState title="ไม่พบหน้านี้" description="หน้าที่คุณค้นหาอาจถูกย้ายหรือไม่มีอยู่" />
      <Button href="/" variant="contained" fullWidth size="large">
        กลับหน้าแรก
      </Button>
    </MobileAppShell>
  );
}
