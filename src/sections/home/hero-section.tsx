import Image from 'next/image';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export function HeroSection() {
  return (
    <Box component="section" id="home" sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 11, md: 12 } }}>
      <Box
        sx={{
          mx: 'auto',
          minHeight: { xs: 650, sm: 620, md: 670 },
          maxWidth: 1440,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: { xs: '28px', md: '44px' },
          bgcolor: '#dff6ff',
          boxShadow: '0 28px 90px rgba(45, 132, 170, 0.18)',
        }}
      >
        <Image
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1440px"
          alt="Loveza Love Potion vitamin soda in Honey Lemon, Lychee and Kyoho Grape"
          src="/assets/loveza/loveza-hero-v2.png"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />

        <Box
          sx={{
            inset: 0,
            position: 'absolute',
            background: {
              xs: 'linear-gradient(180deg, rgba(230,248,255,.04) 20%, rgba(171,225,244,.95) 74%)',
              md: 'linear-gradient(90deg, rgba(226,247,255,.98) 0%, rgba(220,244,253,.88) 40%, rgba(220,244,253,0) 68%)',
            },
          }}
        />

        <Container
          maxWidth="xl"
          sx={{ zIndex: 1, display: 'flex', alignItems: { xs: 'flex-end', md: 'center' }, py: 7 }}
        >
          <Box sx={{ maxWidth: 580, color: '#55296f' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 42, height: 2, bgcolor: '#00a99d' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>
                VITAMIN SODA • 330 ML
              </Typography>
            </Stack>

            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 54, sm: 74, md: 94 },
                fontWeight: 900,
                lineHeight: 0.88,
                letterSpacing: '-0.075em',
                textShadow: '0 8px 32px rgba(76,105,0,.15)',
              }}
            >
              LOVE POTION
              <Box component="span" sx={{ display: 'block', color: '#ef2382' }}>
                ซ่าครบ 3 รส
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 3,
                maxWidth: { xs: 315, sm: 420 },
                fontSize: { xs: 15, md: 18 },
                lineHeight: 1.7,
                overflowWrap: 'anywhere',
              }}
            >
              Loveza Love Potion น้ำดื่มโซดาผสมวิตามิน B3, B6 และ B12
              สดชื่นเต็มกระป๋อง พร้อมส่งทั้ง 3 รสชาติ
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ mt: 4 }}>
              <Button
                href="#finder"
                variant="contained"
                sx={{
                  px: 3.25,
                  py: 1.4,
                  color: '#fff',
                  borderRadius: 99,
                  bgcolor: '#ef2382',
                  boxShadow: '0 14px 28px rgba(239,35,130,.28)',
                  '&:hover': { bgcolor: '#d91873' },
                }}
              >
                ตามหา Loveza ใกล้ฉัน
              </Button>
              <Button href="/auth/user" sx={{ color: '#55296f', borderRadius: 99, px: 2.5 }}>
                Login เพื่อแจ้งพิกัด ↗
              </Button>
            </Stack>
          </Box>
        </Container>

        <Box
          sx={{
            right: 28,
            bottom: 25,
            zIndex: 2,
            display: { xs: 'none', md: 'flex' },
            gap: 1,
            position: 'absolute',
          }}
        >
          {['01', '02', '03'].map((item, index) => (
            <Box
              key={item}
              sx={{
                width: index === 0 ? 54 : 34,
                height: 4,
                borderRadius: 9,
                bgcolor: index === 0 ? '#fff' : 'rgba(255,255,255,.4)',
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
