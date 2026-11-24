import type { Metadata } from 'next';
import type { StoreStatus, MerchantFlavorStock } from 'src/types/store';

import { redirect } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { STORE_LOGO_BUCKET } from 'src/lib/supabase/store-logo';
import { formatBangkokPollDate } from 'src/lib/flavor-poll-schedule';

import { AccountProfile } from 'src/sections/account/account-profile';

import { STORE_STATUS_LABEL } from 'src/types/store';
import { FLAVOR_OPTIONS, getMerchantFlavorStockLabels } from 'src/types/report';

import { AddMerchantPin } from './add-merchant-pin';
import { MerchantStockForm } from './merchant-stock-form';
import { MerchantSettingsCard } from './merchant-settings-form';

export const metadata: Metadata = { title: 'จัดการร้าน | Loveza Hunt', robots: NO_INDEX_ROBOTS };

const pageSize = 20;
const stockColors = {
  available: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
  unknown: 'default',
} as const;
function MerchantLoadError({ part }: { part: string }) {
  return (
    <Alert
      severity="error"
      action={
        <Button href="/account/merchant/" color="inherit" size="small">
          ลองใหม่
        </Button>
      }
    >
      โหลด{part}ไม่สำเร็จ
    </Alert>
  );
}

export default async function MerchantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/merchant');

  const { data: accountType, error: typeError } = await supabase
    .from('account_types')
    .select('kind')
    .eq('user_id', user.id)
    .maybeSingle();
  if (typeError) throw new Error('โหลดประเภทบัญชีไม่สำเร็จ');
  if (!accountType) redirect('/auth/login?next=/account/merchant');
  if (accountType.kind !== 'merchant') redirect('/account');

  const [business, storeTypes] = await Promise.all([
    supabase
      .from('merchant_accounts')
      .select('name, branch_name, store_type_code, self_store_id, logo_path')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('store_types')
      .select('code, name, logo_url')
      .eq('is_active', true)
      .order('sort_order')
      .order('name'),
  ]);
  if (business.error) {
    console.error('[merchant] merchant account query failed', business.error.code);
    return (
      <Box component="main" sx={{ py: { xs: 11, md: 13 }, minHeight: '100dvh' }}>
        <Container maxWidth="lg">
          <MerchantLoadError part="ข้อมูลร้าน" />
        </Container>
      </Box>
    );
  }
  if (storeTypes.error) console.error('[merchant] store types query failed', storeTypes.error.code);

  const ownStoreId = business.data?.self_store_id;
  const q = !ownStoreId && typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const page = ownStoreId
    ? 1
    : Math.min(10000, Math.max(1, Number.parseInt(params.page ?? '', 10) || 1));
  let branches = supabase
    .from('stores')
    .select(
      'id, name, province, district, latitude, longitude, current_status, estimated_quantity, last_reported_at, last_merchant_stock_at, merchant_stock_flavors, merchant_stock_by_flavor, merchant_stores!inner(merchant_id)',
      { count: 'exact' }
    )
    .eq('merchant_stores.merchant_id', user.id)
    .eq('is_active', true)
    .order('id')
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (ownStoreId) branches = branches.eq('id', ownStoreId);
  if (q) branches = branches.ilike('name', `%${q.replace(/[\\%_*]/g, '\\$&')}%`);
  const stores = await branches;
  if (stores.error) console.error('[merchant] stock query failed', stores.error.code);

  const logoPath = business.data?.logo_path;
  const logoUrl = logoPath
    ? supabase.storage.from(STORE_LOGO_BUCKET).getPublicUrl(logoPath).data.publicUrl
    : null;
  const selectedType = business.data?.store_type_code ?? '';
  const masterOptions = [...(storeTypes.data ?? [])];
  if (business.data && selectedType && !masterOptions.some(({ code }) => code === selectedType)) {
    masterOptions.push({
      code: selectedType,
      name: `${business.data.name} (รายการเดิม)`,
      logo_url: null,
    });
  }
  const pageCount = Math.max(1, Math.ceil((stores.count ?? 0) / pageSize));
  const pageHref = (number: number) =>
    `/account/merchant?${new URLSearchParams({ q, page: String(number) })}`;
  if (!stores.error && page > pageCount) redirect(pageHref(pageCount));

  const settingsPanel = (
    <Box sx={{ minWidth: 0 }}>
      {storeTypes.error ? (
        <MerchantLoadError part="ข้อมูลร้านจาก Master" />
      ) : (
        <MerchantSettingsCard
          storeName={business.data?.name}
          currentLogoUrl={logoUrl}
          defaults={{
            logo: null,
            removeLogo: false,
            branch_name: business.data?.branch_name ?? '',
            store_type_code: selectedType,
            name: selectedType ? '' : (business.data?.name ?? ''),
          }}
          stores={masterOptions}
        />
      )}
    </Box>
  );
  const stockPanel = (
    <Stack component="section" aria-labelledby="merchant-stock" spacing={2} sx={{ minWidth: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
      >
        <Typography id="merchant-stock" variant="h6" component="h2" sx={{ scrollMarginTop: 96 }}>
          สต็อกร้านของฉัน
        </Typography>
        {!ownStoreId && (
          <AddMerchantPin ready={Boolean(business.data)} savedPins={stores.data ?? []} />
        )}
      </Stack>
      {!ownStoreId && (q || (stores.count ?? 0) > 1) && (
        <Stack component="form" direction="row" spacing={1} method="get">
          <TextField
            name="q"
            label="ค้นหาชื่อร้าน"
            size="small"
            defaultValue={q}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <Button type="submit" variant="outlined">
            ค้นหา
          </Button>
        </Stack>
      )}

      {stores.error && <MerchantLoadError part="สต็อกร้าน" />}
      {stores.data?.map((store) => {
        const status = store.current_status as StoreStatus;
        const stock = store.merchant_stock_by_flavor as MerchantFlavorStock;
        const flavors = FLAVOR_OPTIONS.map(({ value }) => value).filter(
          (value) =>
            store.last_merchant_stock_at &&
            store.last_merchant_stock_at === store.last_reported_at &&
            store.merchant_stock_flavors.includes(value)
        );
        const breakdown = getMerchantFlavorStockLabels(stock, flavors);
        return (
          <Card
            key={store.id}
            variant="outlined"
            sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, minWidth: 0 }}
          >
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={1.5}
              >
                <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                  <Typography variant="subtitle1" component="h3">
                    {store.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[store.district, store.province].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={STORE_STATUS_LABEL[status]}
                  color={stockColors[status]}
                  variant="soft"
                  sx={{ flexShrink: 0 }}
                />
              </Stack>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                gap={1}
                sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.neutral' }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    จำนวนที่บันทึก
                  </Typography>
                  <Typography variant="subtitle2">
                    {store.estimated_quantity == null
                      ? 'ยังไม่ระบุ'
                      : `${Number(store.estimated_quantity).toLocaleString('th-TH')} กระป๋อง`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    อัปเดตล่าสุด
                  </Typography>
                  <Typography variant="subtitle2">
                    {store.last_reported_at ? (
                      <time dateTime={store.last_reported_at}>
                        {formatBangkokPollDate(store.last_reported_at)} น.
                      </time>
                    ) : (
                      'ยังไม่เคยอัปเดต'
                    )}
                  </Typography>
                </Box>
              </Stack>
              {breakdown.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  รสชาติที่บันทึก: {breakdown.join(' · ')}
                </Typography>
              )}
              <MerchantStockForm
                key={`${store.id}:${store.last_merchant_stock_at}`}
                storeId={store.id}
                filters={{ q, page }}
                stock={stock}
              />
            </Stack>
          </Card>
        );
      })}
      {pageCount > 1 && (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
          {page > 1 && <Button href={pageHref(page - 1)}>ก่อนหน้า</Button>}
          <Typography variant="body2">
            หน้า {page} จาก {pageCount}
          </Typography>
          {page < pageCount && <Button href={pageHref(page + 1)}>ถัดไป</Button>}
        </Stack>
      )}
    </Stack>
  );

  return (
    <AccountProfile
      user={user}
      mode="merchant"
      merchant={{
        name: business.data?.name,
        branchName: business.data?.branch_name,
        logoUrl: logoUrl || masterOptions.find(({ code }) => code === selectedType)?.logo_url,
      }}
      eyebrow="LOVEZA HUNT"
      title="พื้นที่ผู้ประกอบการ Loveza"
      description="จัดการโปรไฟล์ พิกัดร้าน และสต็อกของร้านคุณ"
    >
      <Stack component="section" aria-labelledby="merchant-management" spacing={2.5}>
        <Typography id="merchant-management" variant="h5" component="h2">
          จัดการร้านและสต็อก
        </Typography>
        {settingsPanel}
        {stockPanel}
      </Stack>
    </AccountProfile>
  );
}
