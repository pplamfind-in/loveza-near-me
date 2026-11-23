import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { MobileCardCarousel } from './mobile-card-carousel';
import { explorerCardSx, explorerLabelSx, landingCardRadius } from './explorer-styles';

const highlights = [
  {
    icon: 'ri:compass-3-line',
    title: 'ค้นพบร้านใกล้ตัว',
    body: 'ดูพิกัดและระยะทางจากตำแหน่งของคุณ',
    color: 'var(--palette-primary-lighter)',
  },
  {
    icon: 'ri:time-line',
    title: 'เช็กก่อนออกเดินทาง',
    body: 'ดูสถานะสินค้าและเวลาที่มีคนแจ้งล่าสุด',
    color: 'var(--palette-secondary-lighter)',
  },
  {
    icon: 'ri:map-pin-add-line',
    title: 'ส่งต่อการค้นพบ',
    body: 'พบร้านใหม่? ช่วยเพิ่มพิกัดให้คนต่อไป',
    color: 'var(--palette-primary-lighter)',
  },
];

export function HighlightsSection() {
  return (
    <Container
      component="section"
      maxWidth="lg"
      sx={{ mt: { sm: 2, md: 4 }, pb: { xs: 3, md: 4 } }}
    >
      <MobileCardCarousel
        label="เริ่มต้นใช้งาน Loveza Hunt"
        count={highlights.length}
        gridSx={{
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {highlights.map((item, index) => (
          <Box
            key={item.title}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2.5,
              ...explorerCardSx,
              border: '5px solid var(--palette-background-paper)',
              borderRadius: landingCardRadius,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                display: 'flex',
                borderRadius: '10px',
                bgcolor: item.color,
                color: 'primary.dark',
              }}
            >
              <Iconify icon={item.icon} width={26} />
            </Box>
            <Box>
              <Typography sx={{ ...explorerLabelSx, mb: 0.5, fontSize: 10 }}>
                EXPLORE / 0{index + 1}
              </Typography>
              <Typography component="h2" sx={{ fontSize: 16, fontWeight: 800 }}>
                {item.title}
              </Typography>
              <Typography
                sx={{
                  mt: 0.6,
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: 'var(--palette-text-secondary)',
                }}
              >
                {item.body}
              </Typography>
            </Box>
          </Box>
        ))}
      </MobileCardCarousel>
    </Container>
  );
}
