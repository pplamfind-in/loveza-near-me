import { MobileHeader } from 'src/components/layout/mobile-header';
import { MobileAppShell } from 'src/components/layout/mobile-app-shell';

import { NearbyContent } from './nearby-content';

// ----------------------------------------------------------------------

type NearbyPageProps = {
  searchParams: Promise<{ province?: string }>;
};

export default async function NearbyPage({ searchParams }: NearbyPageProps) {
  const { province } = await searchParams;

  return (
    <MobileAppShell>
      <MobileHeader title="ร้านใกล้ฉัน" showBack />
      <NearbyContent initialProvince={province} />
    </MobileAppShell>
  );
}
