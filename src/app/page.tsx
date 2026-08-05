import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LocalDrinkRounded from '@mui/icons-material/LocalDrinkRounded';

import { createClient } from 'src/lib/supabase/server';
import { getLatestStores } from 'src/services/stores.service';

import { StoreList } from 'src/components/store/store-list';
import { MobileAppShell } from 'src/components/layout/mobile-app-shell';
import { HomeSearchActions } from 'src/components/home/home-search-actions';

// ----------------------------------------------------------------------

export default async function HomePage() {
  const supabase = await createClient();
  const latestStores = await getLatestStores(supabase, 3).catch(() => []);

  return (
    <MobileAppShell>
      <Stack spacing={4} sx={{ pb: 2 }}>
        <Stack spacing={1} alignItems="center" sx={{ pt: 3, textAlign: 'center' }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <LocalDrinkRounded sx={{ fontSize: 36 }} />
          </Stack>
          <Typography variant="h4" fontWeight={800}>
            ตามหา Loveza
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ค้นหาร้านที่พบ Loveza ใกล้คุณ
          </Typography>
        </Stack>

        <HomeSearchActions />

        {latestStores.length > 0 && (
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={800}>
              แจ้งล่าสุด
            </Typography>
            <StoreList stores={latestStores.map((store) => ({ ...store, distanceKm: null }))} />
          </Stack>
        )}

        <Divider />

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          เว็บไซต์นี้เป็นระบบรวบรวมข้อมูลจากผู้ใช้งาน ไม่ใช่เว็บไซต์อย่างเป็นทางการของแบรนด์
          Loveza ข้อมูลสินค้าและจุดจำหน่ายอาจมีการเปลี่ยนแปลง กรุณาตรวจสอบกับร้านค้าก่อนเดินทาง
        </Typography>
      </Stack>
    </MobileAppShell>
  );
}
