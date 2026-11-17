import type { Metadata } from 'next';
import type { MapzaStore } from 'src/types/store';

import { preload } from 'react-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createSeoMetadata } from 'src/lib/seo';
import { createClient } from 'src/lib/supabase/server';
import { provinceColorSettingsFromRow } from 'src/lib/mapza/province-color-scale';

import { Iconify } from 'src/components/iconify';

import { explorerLabelSx } from 'src/sections/home/explorer-styles';

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
  const [storesResult, mapSettingsResult] = await Promise.all([
    supabase
      .from('stores')
      .select(
        'id, name, address, province, district, subdistrict, latitude, longitude, current_status, estimated_quantity, last_reported_at'
      )
      .eq('is_active', true)
      .order('last_reported_at', { ascending: false, nullsFirst: false }),
    supabase.rpc('get_public_map_settings').maybeSingle(),
  ]);

  const stores = (storesResult.data ?? []) as MapzaStore[];
  const hasError = Boolean(storesResult.error);
  const provinceColorSettings = provinceColorSettingsFromRow(mapSettingsResult.data);
  const provinceCount = new Set(stores.map((store) => store.province).filter(Boolean)).size;
  const totalQuantity = stores.reduce(
    (total, store) => total + Math.max(store.estimated_quantity ?? 0, 0),
    0
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 7,
        '& [id]': { scrollMarginTop: 96 },
      }}
    >
      <Box
        component="section"
        sx={{ position: 'relative', overflow: 'hidden', minHeight: { md: 560 } }}
      >
        <Box
          component="img"
          src="/assets/loveza/voxel-loveza-trees-v2.webp"
          alt=""
          width={1536}
          height={1024}
          fetchPriority="high"
          sx={{
            position: 'absolute',
            inset: 0,
            width: 1,
            height: 1,
            objectFit: 'cover',
            objectPosition: 'right 45%',
            maskImage: 'linear-gradient(to bottom, black 70%, transparent)',
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background: {
              xs: 'linear-gradient(180deg, var(--palette-background-default), rgba(251,246,237,.96) 50%, transparent)',
              md: 'linear-gradient(90deg, var(--palette-background-default), rgba(251,246,237,.92) 35%, transparent 80%)',
            },
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box
            sx={{
              maxWidth: 540,
              pt: {
                xs: 'calc(var(--layout-header-mobile-height) + 32px)',
                md: 'calc(var(--layout-header-desktop-height) + 56px)',
              },
              pb: { xs: 22, md: 12 },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'primary.main' }}>
              <Iconify icon="ri:map-2-line" width={20} />
              <Typography sx={explorerLabelSx}>COMMUNITY QUEST · THAILAND</Typography>
            </Stack>
            <Typography
              component="h1"
              sx={{
                mt: 2,
                fontSize: { xs: 42, md: 60 },
                lineHeight: 1.3,
                fontWeight: 900,
                letterSpacing: '-.03em',
              }}
            >
              ช่วยกันเติมแผนที่
              <br />
              <Box component="span" sx={{ color: 'primary.main' }}>
                ให้ซ่าครบทั่วไทย
              </Box>
            </Typography>
            <Typography
              sx={{ mt: 2, maxWidth: 420, color: 'text.secondary', fontSize: 16, lineHeight: 1.85 }}
            >
              ประเทศไทยยังมีพิกัดให้ค้นพบอีกมาก เจอ Loveza ที่ไหน ช่วยปักหมุดที่นั่น
              ทุกพิกัดของคุณเติมสีสันให้แผนที่ของเราสมบูรณ์ขึ้น
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
              <Button
                href="/report"
                variant="contained"
                startIcon={<Iconify icon="ri:map-pin-add-line" />}
                sx={{ px: 3, py: 1.4 }}
              >
                ช่วยเติมพิกัดใหม่
              </Button>
              <Button
                href="#nationwide-map"
                variant="text"
                endIcon={<Iconify icon="ri:arrow-down-line" />}
                sx={{ px: 2, py: 1.4 }}
              >
                ดูภารกิจทั่วไทย
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ position: 'relative', mt: { xs: -4, md: -3 } }}>
        <Box
          component="section"
          aria-label="สรุปพิกัดจากชุมชน"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: { xs: 1, sm: 2 },
            mb: 3,
          }}
        >
          {[
            { image: 'voxel-store.svg', value: stores.length, label: 'จุดขายในแผนที่' },
            { image: 'voxel-map-pin.svg', value: provinceCount, label: 'จังหวัดที่พบ' },
            { image: 'voxel-soda.svg', value: totalQuantity, label: 'กระป๋องที่แจ้งไว้' },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                p: { xs: 1, sm: 1.5 },
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 1.5 },
                flexDirection: { xs: 'column', sm: 'row' },
                bgcolor: 'background.paper',
                border: '5px solid var(--palette-background-paper)',
                borderRadius: '18px',
                boxShadow: '0 4px 0 var(--palette-grey-200)',
              }}
            >
              <Box
                component="img"
                src={`/assets/icons/loveza/${item.image}`}
                alt=""
                width={48}
                height={48}
                sx={{ width: { xs: 36, sm: 48 }, height: { xs: 36, sm: 48 }, flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800, lineHeight: 1.2 }}>
                  {item.value.toLocaleString('th-TH')}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    color: 'text.secondary',
                    fontSize: { xs: 10, sm: 12 },
                    lineHeight: 1.6,
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        <Box id="nationwide-map" component="section">
          <Typography component="h2" sx={{ fontSize: { xs: 23, md: 28 }, fontWeight: 800 }}>
            ภารกิจเติมความซ่าให้ครบ 77 จังหวัด
          </Typography>
          <Typography
            sx={{ mt: 0.75, mb: 2, color: 'text.secondary', fontSize: 13, lineHeight: 1.8 }}
          >
            จังหวัดที่มีพิกัดจะมีสีบนแผนที่ ส่วนพื้นที่ที่ยังไม่มีข้อมูล กำลังรอการค้นพบจากทุกคน
          </Typography>
          <ThailandMap
            stores={stores}
            hasError={hasError}
            provinceColorSettings={provinceColorSettings}
          />
        </Box>
      </Container>
    </Box>
  );
}
