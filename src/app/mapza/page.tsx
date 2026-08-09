import type { Metadata } from 'next';
import type { MapzaStore } from 'src/types/store';

import { preload } from 'react-dom';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createSeoMetadata } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';

import ThailandMap from './thailand-map';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createSeoMetadata({
  title: 'ซ่าทั่วไทย | แผนที่จุดขาย Loveza ทั่วประเทศไทย',
  description:
    'เปิดแผนที่ซ่าทั่วไทย ค้นหาจุดขาย Loveza ที่ผ่านการตรวจสอบ ดูสถานะสินค้า จำนวนคงเหลือ และนำทางไปยังร้านได้ทันที',
  path: '/mapza/',
});

export default async function MapzaPage() {
  preload('/assets/data/thailand-provinces.geojson', { as: 'fetch', crossOrigin: 'anonymous' });
  preload('/assets/data/thailand-province-names.json', { as: 'fetch', crossOrigin: 'anonymous' });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select(
      'id, name, address, province, district, subdistrict, latitude, longitude, current_status, estimated_quantity, last_reported_at'
    )
    .eq('is_active', true)
    .order('last_reported_at', { ascending: false, nullsFirst: false });

  const stores = (data ?? []) as MapzaStore[];
  const hasError = Boolean(error);
  const provinceCount = new Set(stores.map((store) => store.province).filter(Boolean)).size;
  const totalQuantity = stores.reduce(
    (total, store) => total + Math.max(store.estimated_quantity ?? 0, 0),
    0
  );

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: '94px', md: '110px' },
        background:
          'radial-gradient(circle at 12px 12px, rgba(229,0,126,.11) 2px, transparent 2.5px) 0 0 / 28px 28px, linear-gradient(145deg, #FFF1F8 0%, #FFFBE8 55%, #EAFBFF 100%)',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            mb: 4,
            p: { xs: 3, md: 5 },
            overflow: 'hidden',
            position: 'relative',
            color: '#fff',
            border: '3px solid #351129',
            borderRadius: { xs: '26px', md: '38px' },
            background: 'linear-gradient(135deg, #E5007E 0%, #C40088 55%, #7C3AED 125%)',
            boxShadow: '8px 9px 0 #351129',
          }}
        >
          <Box sx={{ zIndex: 1, position: 'relative' }}>
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography
                sx={{
                  px: 1.5,
                  py: 0.7,
                  width: 'fit-content',
                  color: '#351129',
                  fontSize: 11,
                  fontWeight: 1000,
                  letterSpacing: 2,
                  border: '2px solid #351129',
                  borderRadius: 99,
                  bgcolor: '#70E1F5',
                  boxShadow: '3px 3px 0 #351129',
                  transform: 'rotate(-2deg)',
                }}
              >
                LOVEZA NATIONWIDE MAP
              </Typography>
            </Box>
            <Typography
              component="h1"
              sx={{
                mt: 2,
                fontSize: { xs: 46, sm: 58, md: 76 },
                lineHeight: 0.95,
                fontWeight: 1000,
                letterSpacing: '-.06em',
              }}
            >
              ซ่าทั่วไทย
            </Typography>
            <Typography
              sx={{ mt: 2, maxWidth: 700, color: '#FFF0F8', fontSize: { xs: 15, md: 18 } }}
            >
              รวมพิกัดร้าน Loveza ทั่วประเทศ เลือกจังหวัด ดูของเหลือ แล้วไปคว้าความซ่ากันเลย!
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
              {[
                { icon: 'ri:store-2-fill', value: stores.length, label: 'จุดขาย' },
                { icon: 'ri:map-2-fill', value: provinceCount, label: 'จังหวัด' },
                { icon: 'ri:drinks-2-fill', value: totalQuantity, label: 'กระป๋องโดยประมาณ' },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    px: 2,
                    py: 1.25,
                    minWidth: { xs: 120, sm: 150 },
                    color: '#351129',
                    border: '2px solid #351129',
                    borderRadius: 3,
                    bgcolor: '#FFFDF5',
                    boxShadow: '4px 4px 0 #351129',
                  }}
                >
                  <Typography
                    sx={{ fontSize: { xs: 23, md: 30 }, fontWeight: 1000, lineHeight: 1 }}
                  >
                    {item.value.toLocaleString('th-TH')}
                  </Typography>
                  <Typography sx={{ mt: 0.4, fontSize: 11, fontWeight: 900 }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <ThailandMap stores={stores} hasError={hasError} />
      </Container>
    </Box>
  );
}
