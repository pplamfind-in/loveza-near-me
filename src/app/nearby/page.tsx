import type { Metadata } from 'next';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { createSeoMetadata } from 'src/lib/seo';

import { NearbyFinder } from './nearby-finder';

export const metadata: Metadata = createSeoMetadata({
  title: 'Loveza ใกล้ฉัน | แผนที่ร้าน Loveza ใกล้คุณ',
  description:
    'ใช้ตำแหน่ง GPS ค้นหาร้าน Loveza ใกล้คุณ ดูระยะทาง สถานะสินค้า จำนวนคงเหลือ และนำทางไปที่ร้านได้ทันที',
  path: '/nearby/',
});

export default function NearbyPage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: '100px',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 12px 12px, rgba(229,0,126,.1) 2px, transparent 2.5px) 0 0 / 28px 28px, #FFF1F8',
        '&::before': {
          content: '""',
          width: 260,
          height: 260,
          top: '34%',
          left: -150,
          position: 'absolute',
          borderRadius: '50%',
          bgcolor: 'rgba(123,67,161,.10)',
          filter: 'blur(2px)',
        },
        '&::after': {
          content: '""',
          width: 220,
          height: 220,
          right: -120,
          bottom: '12%',
          position: 'absolute',
          borderRadius: '50%',
          bgcolor: 'rgba(37,183,122,.12)',
          filter: 'blur(2px)',
        },
      }}
    >
      <Container maxWidth="xl" sx={{ zIndex: 1, position: 'relative' }}>
        <Box
          sx={{
            mb: 4,
            p: { xs: 3, md: 5 },
            color: '#fff',
            border: '3px solid #351129',
            borderRadius: { xs: '26px', md: '38px' },
            background: 'linear-gradient(135deg, #E5007E 0%, #C40088 56%, #7C3AED 130%)',
            boxShadow: '8px 9px 0 #351129',
          }}
        >
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
            LOVEZA HUNT MODE ON
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 2,
              fontSize: { xs: 44, md: 68 },
              lineHeight: 0.95,
              fontWeight: 1000,
              letterSpacing: '-.06em',
            }}
          >
            Loveza อยู่ไหน?
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 680, color: '#FFF0F8', fontSize: { xs: 15, md: 18 } }}>
            เปิด GPS แล้วออกล่า ดูร้านใกล้ตัว สถานะสินค้า และกดนำทางไปคว้าความซ่าได้ทันที
          </Typography>
        </Box>
        <NearbyFinder />
      </Container>
    </Box>
  );
}
