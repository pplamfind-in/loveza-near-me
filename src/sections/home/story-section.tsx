import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

export function StorySection() {
  return (
    <Container maxWidth="lg">
      <Box
        component="section"
        id="about"
        sx={{
          pt: { xs: 3, md: 4 },
          pb: { xs: 4, md: 5 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 4, md: 8 },
          alignItems: 'center',
        }}
      >
        <Box sx={{ position: 'relative', pb: 3, pr: 3 }}>
          <Box
            component="img"
            src="/assets/loveza/voxel-loveza-trees-v2.webp"
            alt="โลกแห่งการสำรวจ ร้านเล็ก ๆ และเส้นทางที่เชื่อมชุมชน"
            loading="lazy"
            width={1536}
            height={1024}
            sx={{
              display: 'block',
              width: 1,
              height: { xs: 260, md: 330 },
              objectFit: 'cover',
              objectPosition: 'right bottom',
              border: '5px solid var(--palette-background-paper)',
              borderRadius: '18px',
              boxShadow: '0 12px 32px rgba(65,49,30,.1)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              p: 2,
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              bgcolor: 'background.paper',
              border: '1px solid var(--palette-grey-300)',
              borderRadius: '14px',
              boxShadow: '0 8px 24px rgba(65,49,30,.08)',
            }}
          >
            <Iconify icon="ri:map-pin-add-line" width={30} sx={{ color: 'primary.main' }} />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>พิกัดเล็ก ๆ ของคุณ</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                ช่วยการเดินทางของคนต่อไป
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box>
          <Typography
            sx={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: 'primary.main' }}
          >
            BUILT BY THE COMMUNITY
          </Typography>
          <Typography
            component="h2"
            sx={{ mt: 2, fontSize: { xs: 30, md: 40 }, fontWeight: 900, lineHeight: 1.35 }}
          >
            ทุกการค้นพบ
            <br />
            ต่อเติมแผนที่ของเรา
          </Typography>
          <Typography sx={{ mt: 2, color: 'text.secondary', lineHeight: 1.9 }}>
            Loveza Hunt เริ่มจากคำถามง่าย ๆ ว่า “หาซื้อได้ที่ไหน?”
            เราจึงชวนทุกคนมาช่วยกันปักหมุดร้าน แชร์สิ่งที่พบ และทำให้การตามหา Loveza
            ครั้งต่อไปง่ายขึ้น
          </Typography>
          <Button
            href="/about-us"
            color="inherit"
            endIcon={<Iconify icon="ri:arrow-right-line" />}
            sx={{ mt: 2, px: 0, textDecoration: 'underline', textUnderlineOffset: 5 }}
          >
            รู้จัก Loveza Hunt
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export function AdventureSection() {
  return (
    <Container maxWidth="lg">
      <Box
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '18px',
          mb: { xs: 5, md: 8 },
          p: { xs: 3, md: 5 },
          minHeight: 260,
          bgcolor: 'primary.lighter',
        }}
      >
        <Box
          component="img"
          src="/assets/loveza/voxel-loveza-trees-v2.webp"
          alt=""
          loading="lazy"
          sx={{
            position: 'absolute',
            inset: 0,
            width: 1,
            height: 1,
            objectFit: 'cover',
            objectPosition: 'center 70%',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, var(--palette-background-paper) 5%, rgba(255,253,250,.92) 40%, rgba(255,253,250,.1) 100%)',
          }}
        />
        <Box sx={{ position: 'relative', maxWidth: 430 }}>
          <Typography
            component="h2"
            sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 900, lineHeight: 1.4 }}
          >
            เริ่มจากร้านใกล้ตัว
            <br />
            แล้วออกไปเจอความซ่า
          </Typography>
          <Button
            href="/nearby"
            variant="contained"
            endIcon={<Iconify icon="ri:arrow-right-line" />}
            sx={{ mt: 3, px: 3 }}
          >
            ออกสำรวจกันเลย
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
