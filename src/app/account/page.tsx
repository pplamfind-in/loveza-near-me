import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { NO_INDEX_ROBOTS } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';

import { AccountProfile, ExplorerAccountPanels } from 'src/sections/account/account-profile';

import { AddMerchantButton } from './merchant/merchant-settings-form';

export const metadata: Metadata = {
  title: 'บัญชีของฉัน | Loveza Hunt',
  robots: NO_INDEX_ROBOTS,
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const [{ data: accountType, error: accountTypeError }, merchant] = await Promise.all([
    supabase.from('account_types').select('kind').eq('user_id', user.id).maybeSingle(),
    supabase.from('merchant_accounts').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);
  if (accountTypeError) throw new Error('โหลดประเภทบัญชีไม่สำเร็จ');
  if (!accountType) redirect('/auth/login');
  if (accountType.kind === 'merchant') redirect('/account/merchant');

  const needsStore = !merchant.error && !merchant.data;
  const storeTypes = needsStore
    ? await supabase
        .from('store_types')
        .select('code, name, logo_url')
        .eq('is_active', true)
        .order('sort_order')
        .order('name')
    : null;

  return (
    <AccountProfile
      user={user}
      addMerchant={needsStore ? <AddMerchantButton stores={storeTypes?.data ?? null} /> : undefined}
    >
      <ExplorerAccountPanels userId={user.id} />
    </AccountProfile>
  );
}
