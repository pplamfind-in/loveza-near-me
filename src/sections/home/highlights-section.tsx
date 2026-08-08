import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

const highlights = [
  {
    icon: 'ri:map-pin-2-fill',
    value: 'ค้นหาใกล้ฉัน',
    label: 'ดูร้านจาก GPS แบบเรียลไทม์',
    color: '#E5007E',
  },
  {
    icon: 'ri:drinks-2-fill',
    value: '3 รสชาติ',
    label: 'สดใส ซ่า และเลือกได้ตามใจ',
    color: '#7C3AED',
  },
  {
    icon: 'ri:capsule-fill',
    value: 'วิตามินบี',
    label: 'ผสมวิตามิน B3, B6 และ B12',
    color: '#00A99D',
  },
  {
    icon: 'ri:community-fill',
    value: 'Community',
    label: 'ช่วยกันแจ้งจุดขายที่พบเจอ',
    color: '#F59E0B',
  },
];

export function HighlightsSection() {
  return (
    <Box component="section" aria-label="จุดเด่นของ Loveza" sx={{ px: { xs: 1.5, sm: 3 }, mt: 4 }}>
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: 3, md: -2 },
          p: { xs: '10px !important', sm: '14px !important' },
          zIndex: 2,
          display: 'grid',
          position: 'relative',
          gap: { xs: 1, md: 1.5 },
          border: '3px solid #351129',
          borderRadius: { xs: '24px', md: '28px' },
          background: '#351129',
          boxShadow: '7px 8px 0 #E5007E',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        {highlights.map((item, index) => (
          <Box
            key={item.value}
            sx={{
              p: { xs: 1.5, sm: 2.25 },
              display: 'flex',
              gap: 1.5,
              minWidth: 0,
              alignItems: 'center',
              border: '2px solid #351129',
              borderRadius: '18px',
              bgcolor: ['#FFE0F0', '#E8DEFF', '#DDFBF7', '#FFF0B8'][index],
              transform: { md: index % 2 ? 'rotate(1deg)' : 'rotate(-1deg)' },
              transition: 'transform 180ms ease',
              '&:hover': { transform: 'translateY(-5px) rotate(0deg)' },
            }}
          >
            <Box
              sx={{
                width: { xs: 38, sm: 46 },
                height: { xs: 38, sm: 46 },
                flexShrink: 0,
                display: 'grid',
                color: '#fff',
                placeItems: 'center',
                border: '2px solid #351129',
                borderRadius: '13px',
                bgcolor: item.color,
                boxShadow: '2px 3px 0 #351129',
              }}
            >
              <Iconify icon={item.icon} width={22} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: 13, sm: 16 }, fontWeight: 900, lineHeight: 1.2 }}>
                {item.value}
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  color: 'text.secondary',
                  fontSize: { xs: 10, sm: 12 },
                  lineHeight: 1.4,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Container>
    </Box>
  );
}
