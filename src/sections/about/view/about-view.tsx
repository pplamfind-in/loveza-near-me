'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

const missions = [
  {
    icon: 'ri:map-pin-2-fill',
    title: 'หาร้านง่ายขึ้น',
    body: 'เปิด GPS แล้วดูจุดขาย Loveza ใกล้ตัว พร้อมระยะทางและสถานะสินค้า',
    color: '#70E1F5',
  },
  {
    icon: 'ri:community-fill',
    title: 'ช่วยกันบอกต่อ',
    body: 'ทุกพิกัดจาก Community ช่วยให้คนอื่นไม่ต้องเดินหาร้านแบบเดาสุ่ม',
    color: '#FDE047',
  },
  {
    icon: 'ri:shield-check-fill',
    title: 'ข้อมูลไว้ใจได้',
    body: 'ผู้แจ้งลงชื่อด้วย Google และทีม Admin สามารถตรวจสอบข้อมูลในระบบได้',
    color: '#DDFBF7',
  },
];

export function AboutView() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: 5, md: 8 },
        background:
          'radial-gradient(circle at 12px 12px, rgba(229,0,126,.1) 2px, transparent 2.5px) 0 0 / 28px 28px, #FFF1F8',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            p: { xs: 3.5, sm: 5, md: 7 },
            color: '#fff',
            overflow: 'hidden',
            position: 'relative',
            border: '3px solid #351129',
            borderRadius: { xs: '28px', md: '42px' },
            bgcolor: '#E5007E',
            boxShadow: '9px 10px 0 #351129',
          }}
        >
          <Typography
            sx={{
              px: 1.5,
              py: 0.75,
              width: 'fit-content',
              color: '#351129',
              fontSize: 11,
              fontWeight: 1000,
              letterSpacing: 2,
              border: '2px solid #351129',
              borderRadius: 99,
              bgcolor: '#FDE047',
              boxShadow: '3px 3px 0 #351129',
              transform: 'rotate(-2deg)',
            }}
          >
            ABOUT LOVEZA HUNT
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 3,
              maxWidth: 820,
              fontSize: { xs: 48, md: 78 },
              lineHeight: 0.93,
              fontWeight: 1000,
              letterSpacing: '-.07em',
            }}
          >
            เพราะความซ่า ไม่ควรหายาก
          </Typography>
          <Typography
            sx={{
              mt: 3,
              maxWidth: 680,
              color: '#FFF0F8',
              fontSize: { xs: 16, md: 19 },
              lineHeight: 1.7,
            }}
          >
            Loveza Hunt คือพื้นที่ของคนที่ชอบ Loveza ช่วยกันปักหมุดร้าน เช็กจำนวนที่เหลือ
            และส่งต่อพิกัดให้ทุกคนตามไปซื้อได้ง่ายขึ้น
          </Typography>
          <Button
            href="/nearby"
            variant="contained"
            startIcon={<Iconify icon="ri:map-pin-2-fill" />}
            sx={{
              mt: 4,
              color: '#351129',
              border: '2px solid #351129',
              backgroundImage: 'none',
              bgcolor: '#FDE047',
              boxShadow: '4px 5px 0 #351129',
            }}
          >
            ออกตามหา Loveza
          </Button>
        </Box>

        <Box
          component="section"
          sx={{
            mt: { xs: 7, md: 10 },
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          {missions.map((item, index) => (
            <Box
              key={item.title}
              sx={{
                p: 3.5,
                minHeight: 260,
                border: '3px solid #351129',
                borderRadius: '28px',
                bgcolor: item.color,
                boxShadow: '6px 7px 0 #351129',
                transform: { md: index === 1 ? 'translateY(22px) rotate(1deg)' : 'rotate(-1deg)' },
              }}
            >
              <Iconify icon={item.icon} width={38} />
              <Typography component="h2" sx={{ mt: 5, fontSize: 26, fontWeight: 1000 }}>
                {item.title}
              </Typography>
              <Typography sx={{ mt: 1, color: '#5B3A50', lineHeight: 1.7 }}>{item.body}</Typography>
            </Box>
          ))}
        </Box>

        <Box
          component="section"
          sx={{
            mt: { xs: 8, md: 13 },
            p: { xs: 3.5, md: 6 },
            color: '#fff',
            border: '3px solid #351129',
            borderRadius: { xs: '28px', md: '38px' },
            bgcolor: '#6D28D9',
            boxShadow: '8px 9px 0 #351129',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="space-between">
            <Box>
              <Typography sx={{ color: '#70E1F5', fontWeight: 1000, letterSpacing: 2 }}>
                OUR COMMUNITY
              </Typography>
              <Typography
                component="h2"
                sx={{
                  mt: 1,
                  maxWidth: 600,
                  fontSize: { xs: 38, md: 58 },
                  lineHeight: 1,
                  fontWeight: 1000,
                }}
              >
                เจอ → แจ้ง → ส่งต่อความซ่า
              </Typography>
            </Box>
            <Typography sx={{ maxWidth: 420, color: '#F4EFFF', fontSize: 16, lineHeight: 1.8 }}>
              เมื่อพบ Loveza เพียงเข้าสู่ระบบ ปักพิกัดและบอกจำนวนที่เห็น
              ข้อมูลของคุณจะช่วยให้แผนที่นี้สดใหม่และมีประโยชน์กับทุกคน
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
