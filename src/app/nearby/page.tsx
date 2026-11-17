import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createSeoMetadata } from 'src/lib/seo';

import { Iconify } from 'src/components/iconify';

import { explorerLabelSx } from 'src/sections/home/explorer-styles';

import { NearbyFinder } from './nearby-finder';

export const metadata: Metadata = createSeoMetadata({
  title: 'Loveza ใกล้ฉัน — ค้นหาร้านขายเลิฟซ่า | Loveza Hunt',
  description:
    'ใช้ตำแหน่ง GPS ค้นหาร้าน Loveza ใกล้คุณ ดูระยะทาง สถานะสินค้า จำนวนคงเหลือ และนำทางไปที่ร้านได้ทันที',
  path: '/nearby/',
});

const steps = [
  { icon: 'ri:compass-3-line', title: 'เปิดตำแหน่ง', body: 'เริ่มจากจุดที่คุณอยู่' },
  { icon: 'ri:store-2-line', title: 'ค้นพบร้านใกล้ตัว', body: 'เช็กสถานะและเวลาอัปเดต' },
  { icon: 'ri:route-line', title: 'เลือกแล้วออกเดินทาง', body: 'เปิดเส้นทางไปยังร้าน' },
];

export default function NearbyPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: 6,
        bgcolor: 'background.default',
        '& [id]': { scrollMarginTop: 96 },
      }}
    >
      <Box
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: { md: '66.6667vw' },
        }}
      >
        <Box
          component="img"
          src="/assets/loveza/nearby-explorer-v1.webp"
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
            objectPosition: { xs: '65% bottom', md: 'center bottom' },
            maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background: {
              xs: 'linear-gradient(180deg, var(--palette-background-default) 0%, rgba(251,246,237,.96) 45%, transparent 75%)',
              md: 'linear-gradient(90deg, rgba(251,246,237,.5), transparent 65%)',
            },
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box
            sx={{
              maxWidth: 560,
              pt: {
                xs: 'calc(var(--layout-header-mobile-height) + 32px)',
                md: 'calc(var(--layout-header-desktop-height) + 56px)',
              },
              pb: { xs: 34, sm: 44, md: 20 },
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="ri:compass-discover-line" width={20} sx={{ color: 'primary.main' }} />
              <Typography sx={explorerLabelSx}>NEARBY EXPLORER</Typography>
            </Stack>
            <Typography
              component="h1"
              sx={{
                mt: 2,
                fontSize: { xs: 36, sm: 44, md: 50 },
                fontWeight: 900,
                lineHeight: 1.3,
                letterSpacing: '-.03em',
              }}
            >
              การผจญภัยครั้งใหม่
              <br />
              เริ่มที่{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                Loveza ใกล้คุณ
              </Box>
            </Typography>
            <Typography
              sx={{
                mt: 2,
                maxWidth: 420,
                fontSize: 16,
                lineHeight: 1.85,
                color: 'text.secondary',
              }}
            >
              เปิดแผนที่ความซ่า ค้นพบร้านรอบตัว
              <br />
              เลือกพิกัดที่ใช่ แล้วออกไปเจอ Loveza กัน
            </Typography>
            <Stack
              component="section"
              aria-label="สามขั้นตอนค้นหาร้าน"
              spacing={1.5}
              sx={{ mt: 3, maxWidth: 440 }}
            >
              {steps.map((step, index) => (
                <Stack key={step.title} direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      flexShrink: 0,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: index === 1 ? 'secondary.lighter' : 'primary.lighter',
                      color: 'primary.dark',
                      borderRadius: '10px',
                    }}
                  >
                    <Iconify icon={step.icon} width={20} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                      {index + 1}. {step.title}
                    </Typography>
                    <Typography sx={{ mt: 0.25, fontSize: 11, color: 'text.secondary' }}>
                      {step.body}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
            <Button
              href="#nearby-search"
              variant="contained"
              endIcon={<Iconify icon="ri:arrow-down-line" />}
              sx={{ mt: 3, px: 3, py: 1.4 }}
            >
              เริ่มภารกิจใกล้ฉัน
            </Button>
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{ mt: 2, color: 'text.secondary' }}
            >
              <Iconify icon="ri:shield-check-line" width={15} />
              <Typography sx={{ fontSize: 11 }}>ค้นหาร้านได้ ไม่ต้องเข้าสู่ระบบ</Typography>
            </Stack>
          </Box>
        </Container>
      </Box>
      <Container
        maxWidth="lg"
        sx={{ position: 'relative', zIndex: 1, mt: { xs: -6, sm: -10, md: -8, lg: -12, xl: -16 } }}
      >
        <NearbyFinder />
      </Container>
    </Box>
  );
}
