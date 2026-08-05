import type { Metadata } from 'next';
import type { ReportFormValues } from 'src/validations/report.schema';

import { CONFIG } from 'src/global-config';

import { ReportForm } from 'src/components/report/report-form';
import { MobileHeader } from 'src/components/layout/mobile-header';
import { MobileAppShell } from 'src/components/layout/mobile-app-shell';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `แจ้งพิกัด | ${CONFIG.appName}` };

type ReportPageProps = {
  searchParams: Promise<{
    storeName?: string;
    province?: string;
    district?: string;
    subdistrict?: string;
    latitude?: string;
    longitude?: string;
  }>;
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const params = await searchParams;

  const defaultValues: Partial<ReportFormValues> = {
    storeName: params.storeName ?? '',
    province: params.province ?? '',
    district: params.district ?? '',
    subdistrict: params.subdistrict ?? '',
    latitude: params.latitude ? Number(params.latitude) : undefined,
    longitude: params.longitude ? Number(params.longitude) : undefined,
  };

  return (
    <MobileAppShell>
      <MobileHeader title="แจ้งพิกัด" showBack />
      <ReportForm defaultValues={defaultValues} />
    </MobileAppShell>
  );
}
