import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { requireAdminClient } from 'src/lib/supabase/require-admin';

import { setMerchantBranches } from './actions';

export const metadata: Metadata = { title: 'บัญชีผู้ประกอบการ | Loveza Admin' };

export default async function AdminMerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    branch?: string;
    status?: string;
    count?: string;
    page?: string;
  }>;
}) {
  const [{ supabase, user }, params] = await Promise.all([requireAdminClient(), searchParams]);
  if (!user) redirect('/auth/login');

  const q = (typeof params.q === 'string' ? params.q : '').trim().slice(0, 100);
  const branch = (typeof params.branch === 'string' ? params.branch : '').trim().slice(0, 100);
  const pageSize = 20;
  const page = Math.min(10000, Math.max(1, Number.parseInt(params.page ?? '', 10) || 1));
  let merchantsQuery = supabase
    .from('merchant_accounts')
    .select('user_id, name, branch_request', { count: 'exact' })
    .order('name')
    .order('user_id')
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (q) merchantsQuery = merchantsQuery.ilike('name', `%${q.replace(/[\\%_*]/g, '\\$&')}%`);

  const [merchants, chains, matchingBranches] = await Promise.all([
    merchantsQuery,
    supabase
      .from('store_types')
      .select('code, name')
      .not('code', 'in', '(general,other,unknown)')
      .order('name'),
    branch
      ? supabase
          .from('stores')
          .select('id, name, province, district')
          .ilike('name', `%${branch.replace(/[\\%_*]/g, '\\$&')}%`)
          .order('name')
          .order('id')
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (merchants.error || chains.error || matchingBranches.error)
    throw new Error('โหลดข้อมูลผู้ประกอบการไม่สำเร็จ');

  const requests = new Map(
    (merchants.data ?? []).flatMap(({ user_id, branch_request }) => {
      const id = /(?:^|\n)รหัสหมุด: ([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i.exec(
        branch_request
      )?.[1];
      return id ? [[user_id, id] as const] : [];
    })
  );
  const requestedBranches = requests.size
    ? await supabase
        .from('stores')
        .select('id, name, province, district')
        .in('id', [...new Set(requests.values())])
    : { data: [], error: null };
  if (requestedBranches.error) throw new Error('โหลดหมุดที่ขอสิทธิ์ไม่สำเร็จ');
  const branchesById = new Map((requestedBranches.data ?? []).map((store) => [store.id, store]));
  const merchantRows = (merchants.data ?? []).map((merchant) => {
    const requestedStore = branchesById.get(requests.get(merchant.user_id) ?? '');
    const options = [...(matchingBranches.data ?? [])];
    if (requestedStore && !options.some(({ id }) => id === requestedStore.id))
      options.unshift(requestedStore);
    return { ...merchant, requestedStore, options };
  });

  const count = Math.max(0, Number.parseInt(params.count ?? '', 10) || 0);
  const pageCount = Math.max(1, Math.ceil((merchants.count ?? 0) / pageSize));
  const pageHref = (number: number) =>
    `/admin/merchants?${new URLSearchParams({ q, branch, page: String(number) })}`;
  if (page > pageCount) redirect(pageHref(pageCount));

  return (
    <DashboardContent maxWidth="lg">
      <Stack spacing={3}>
        <Typography component="h1" variant="h4">
          บัญชีผู้ประกอบการ
        </Typography>
        {(params.status === 'grant' || params.status === 'revoke') && (
          <Alert severity={count ? 'success' : 'info'}>
            {params.status === 'grant' ? `ผูกสิทธิ์ใหม่ ${count} สาขา` : `ถอนสิทธิ์ ${count} สาขา`}
          </Alert>
        )}
        {params.status === 'invalid' && (
          <Alert severity="warning">เลือกสาขาหรือเครือร้านอย่างใดอย่างหนึ่ง</Alert>
        )}
        {params.status === 'error' && <Alert severity="error">เปลี่ยนสิทธิ์สาขาไม่สำเร็จ</Alert>}
        <Stack component="form" method="get" direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField name="q" label="ค้นหาผู้ประกอบการ" size="small" defaultValue={q} />
          <TextField
            name="branch"
            label="ค้นหาสาขาเพื่อผูกสิทธิ์"
            size="small"
            defaultValue={branch}
          />
          <Button type="submit" variant="outlined">
            ค้นหา
          </Button>
        </Stack>
        {branch && !matchingBranches.data?.length && (
          <Alert severity="info">ไม่พบสาขาตามคำค้น</Alert>
        )}
        {!merchants.data?.length && <Alert severity="info">ไม่พบบัญชีผู้ประกอบการ</Alert>}
        {merchantRows.map((merchant) => (
          <Card key={merchant.user_id} sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <div>
                <Typography variant="h6">{merchant.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {merchant.user_id}
                </Typography>
                {merchant.branch_request && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}
                  >
                    {merchant.branch_request}
                  </Typography>
                )}
              </div>
              <Stack component="form" action={setMerchantBranches} spacing={1.5}>
                <input type="hidden" name="merchantId" value={merchant.user_id} />
                <TextField
                  name="storeId"
                  label="สาขาที่ขอสิทธิ์หรือค้นหา"
                  select
                  defaultValue={merchant.requestedStore?.id ?? ''}
                  slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                >
                  <option value="">เลือกสาขา</option>
                  {merchant.options.map((store) => (
                    <option key={store.id} value={store.id}>
                      {[store.name, store.district, store.province].filter(Boolean).join(' · ')}
                    </option>
                  ))}
                </TextField>
                <TextField
                  name="storeType"
                  label="หรือเลือกทั้งเครือร้าน"
                  select
                  defaultValue=""
                  slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
                >
                  <option value="">เลือกเครือร้าน</option>
                  {chains.data?.map((chain) => (
                    <option key={chain.code} value={chain.code}>
                      {chain.name}
                    </option>
                  ))}
                </TextField>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" name="access" value="grant" variant="contained">
                    ผูกสิทธิ์
                  </Button>
                  <Button
                    type="submit"
                    name="access"
                    value="revoke"
                    variant="outlined"
                    color="error"
                  >
                    ถอนสิทธิ์
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        ))}
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
    </DashboardContent>
  );
}
