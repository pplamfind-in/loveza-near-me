import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

export function HeroSection() {
  return (
    <Box component="section" id="home">
      <Box
        sx={{
          position: 'relative',
          isolation: 'isolate',
          bgcolor: 'background.default',
          minHeight: { md: 'clamp(580px, 60vw, 900px)' },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              maxWidth: 560,
              pt: {
                xs: 'calc(var(--layout-header-mobile-height) + 24px)',
                md: 'calc(var(--layout-header-desktop-height) + 64px)',
              },
              pb: { xs: 'clamp(120px, 35vw, 210px)', md: 8 },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: { xs: 2, md: 3 }, color: 'var(--palette-primary-main)' }}
            >
              <Iconify icon="ri:compass-3-fill" width={20} />
              <Typography
                sx={{
                  fontSize: { xs: 10, sm: 12 },
                  fontWeight: 800,
                  letterSpacing: { xs: 1.3, sm: 1.8 },
                }}
              >
                A LITTLE HUNT. A NEW DISCOVERY.
              </Typography>
            </Stack>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 36, sm: 48, lg: 58 },
                lineHeight: 1.22,
                fontWeight: 900,
                letterSpacing: '-.04em',
                color: 'var(--palette-text-primary)',
              }}
            >
              ค้นพบร้านใหม่
              <br />
              ตามหา{' '}
              <Box component="span" sx={{ color: '#FC0868' }}>
                LOVE ZA
              </Box>
              <br />
              ใกล้คุณ
            </Typography>
            <Typography
              sx={{
                mt: { xs: 2, md: 2.5 },
                maxWidth: 450,
                fontSize: { xs: 14, sm: 16, md: 18 },
                lineHeight: 1.85,
                color: 'var(--palette-text-secondary)',
              }}
            >
              Love Za (เลิฟซ่า) ซื้อที่ไหน? ค้นหาร้านจากแผนที่ชุมชน
              <br />
              เช็กพิกัด ดูสถานะสินค้า แล้วออกไปเจอความซ่า
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{
                mt: { xs: 2.5, md: 3.5 },
                maxWidth: 440,
                alignItems: { xs: 'flex-start', sm: 'center' },
              }}
            >
              <Button
                href="/nearby"
                variant="contained"
                size="large"
                startIcon={<Iconify icon="ri:map-pin-2-fill" />}
                sx={{
                  px: 3,
                  py: { xs: 1.25, md: 1.6 },
                  width: { xs: '100%', sm: 'auto' },
                  minHeight: 48,
                  borderRadius: '12px',
                  bgcolor: 'var(--palette-primary-main)',
                  boxShadow: '0 4px 0 var(--palette-primary-dark)',
                  '&:hover': { bgcolor: 'var(--palette-primary-dark)' },
                }}
              >
                เริ่มค้นหาร้านใกล้ฉัน
              </Button>
              <Button
                href="#how-it-works"
                size="large"
                sx={{
                  color: 'primary.dark',
                  px: { xs: 0, sm: 2 },
                  minHeight: 40,
                  fontSize: { xs: 13, sm: 14 },
                }}
              >
                ใช้งานอย่างไร <Iconify icon="ri:arrow-down-line" width={18} sx={{ ml: 1 }} />
              </Button>
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                mt: { xs: 1.5, md: 2.5 },
                color: 'var(--palette-text-secondary)',
              }}
            >
              <Iconify icon="ri:shield-check-line" width={17} />
              <Typography sx={{ fontSize: 12 }}>ค้นหาร้านได้โดยไม่ต้องเข้าสู่ระบบ</Typography>
            </Stack>
          </Box>
        </Container>
        <Box
          component="img"
          src="/assets/loveza/voxel-loveza-trees-v2.webp"
          alt=""
          fetchPriority="high"
          width={1536}
          height={1024}
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: -2,
            width: 1,
            height: 1,
            objectFit: 'cover',
            objectPosition: { xs: '65% bottom', md: 'center bottom' },
            maskImage: {
              xs: 'linear-gradient(to bottom, #000 calc(100% - 56px), transparent)',
              md: 'linear-gradient(to bottom, #000 calc(100% - 80px), transparent)',
            },
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: -1,
            pointerEvents: 'none',
            background: {
              xs: 'linear-gradient(180deg, rgba(251,246,237,.98) 0%, rgba(251,246,237,.92) 58%, rgba(251,246,237,.58) 76%, transparent 100%)',
              md: 'linear-gradient(90deg, rgba(251,246,237,.98) 0%, rgba(251,246,237,.89) 38%, transparent 71%)',
            },
          }}
        />
      </Box>
    </Box>
  );
}
