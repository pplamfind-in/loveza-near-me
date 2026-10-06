import { NextResponse } from 'next/server';

import { createClient } from 'src/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, store_id, store_name, store_type, address, province, district, flavors, stock_status, estimated_quantity, approval_status, created_at'
    )
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Database query failed' }, { status: 500 });

  // Approved reports keep their original submission, while the card uses
  // the current store identity after an admin correction.
  const storeIds = [
    ...new Set(
      (data ?? [])
        .filter((report) => report.approval_status === 'approved' && report.store_id)
        .map((report) => report.store_id as string)
    ),
  ];
  const { data: stores, error: storesError } = storeIds.length
    ? await supabase
        .from('stores')
        .select('id, name, store_type, address, province, district')
        .in('id', storeIds)
    : { data: [], error: null };
  if (storesError) return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  const storesById = new Map((stores ?? []).map((store) => [store.id, store]));
  const reports = (data ?? []).map((report) => {
    const store =
      report.approval_status === 'approved' && report.store_id
        ? storesById.get(report.store_id)
        : undefined;
    return {
      ...report,
      store_name: store ? store.name : report.store_name,
      store_type: store ? store.store_type : report.store_type,
      address: store ? store.address : report.address,
      province: store ? store.province : report.province,
      district: store ? store.district : report.district,
    };
  });
  const codes = [...new Set(reports.map((report) => report.store_type))];
  const { data: storeTypes, error: storeTypesError } = codes.length
    ? await supabase.from('store_types').select('code, name').in('code', codes)
    : { data: [], error: null };
  if (storeTypesError)
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });

  const names = new Map((storeTypes ?? []).map((item) => [item.code, item.name]));
  return NextResponse.json(
    {
      reports: reports.map((report) => ({
        ...report,
        store_type_name: names.get(report.store_type) ?? report.store_type,
      })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
