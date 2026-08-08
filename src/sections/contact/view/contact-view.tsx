'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

export function ContactView() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: 5, md: 8 },
        background:
          'radial-gradient(circle at 12px 12px, rgba(124,58,237,.1) 2px, transparent 2.5px) 0 0 / 28px 28px, #FFF1F8',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            p: { xs: 3.5, md: 6 },
            color: '#fff',
            border: '3px solid #351129',
            borderRadius: { xs: '28px', md: '40px' },
            background: 'linear-gradient(135deg, #6D28D9, #E5007E)',
            boxShadow: '9px 10px 0 #351129',
          }}
        >
          <Typography sx={{ color: '#FDE047', fontSize: 12, fontWeight: 1000, letterSpacing: 2 }}>
            LET&apos;S TALK!
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 1.5,
              maxWidth: 760,
              fontSize: { xs: 48, md: 76 },
              lineHeight: 0.95,
              fontWeight: 1000,
              letterSpacing: '-.07em',
            }}
          >
            มีอะไรอยากบอกเราไหม?
          </Typography>
          <Typography
            sx={{ mt: 2.5, maxWidth: 650, color: '#FFF0F8', fontSize: { xs: 16, md: 18 } }}
          >
            แจ้งปัญหา เสนอไอเดีย หรือบอกเล่าประสบการณ์ตามหา Loveza ได้ที่นี่
          </Typography>
        </Box>

        <Box
          component="section"
          sx={{
            mt: 4,
            display: 'grid',
            gap: 3,
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', md: '.75fr 1.25fr' },
          }}
        >
          <Stack spacing={2}>
            {[
              {
                icon: 'ri:map-pin-2-fill',
                title: 'พิกัดร้านไม่ตรง?',
                body: 'แจ้งรายละเอียดจุดขายที่ควรแก้ไขให้ทีมตรวจสอบ',
                color: '#70E1F5',
              },
              {
                icon: 'ri:lightbulb-flash-fill',
                title: 'มีไอเดียเริ่ด ๆ?',
                body: 'เสนอ Feature ที่อยากเห็นใน Loveza Near Me',
                color: '#FDE047',
              },
              {
                icon: 'ri:heart-3-fill',
                title: 'อยากช่วย Community?',
                body: 'ออกตามหาแล้วแจ้งพิกัดใหม่ได้ทันที',
                color: '#FFB7D9',
              },
            ].map((item) => (
              <Box
                key={item.title}
                sx={{
                  p: 3,
                  border: '3px solid #351129',
                  borderRadius: '24px',
                  bgcolor: item.color,
                  boxShadow: '5px 6px 0 #351129',
                }}
              >
                <Iconify icon={item.icon} width={28} />
                <Typography sx={{ mt: 2, fontSize: 21, fontWeight: 1000 }}>{item.title}</Typography>
                <Typography sx={{ mt: 0.5, color: '#5B3A50' }}>{item.body}</Typography>
              </Box>
            ))}
          </Stack>

          <Box
            sx={{
              p: { xs: 3, md: 4.5 },
              border: '3px solid #351129',
              borderRadius: '30px',
              bgcolor: '#fff',
              boxShadow: '7px 8px 0 #351129',
            }}
          >
            <Typography component="h2" sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 1000 }}>
              ส่งข้อความถึงทีม Loveza
            </Typography>
            <Stack spacing={2.25} sx={{ mt: 3 }}>
              <TextField fullWidth label="ชื่อของคุณ" />
              <TextField fullWidth type="email" label="อีเมล" />
              <TextField fullWidth label="หัวข้อ" />
              <TextField fullWidth multiline rows={5} label="เล่าให้เราฟังได้เลย" />
              <Button
                size="large"
                variant="contained"
                startIcon={<Iconify icon="ri:send-plane-fill" />}
                sx={{
                  color: '#351129',
                  border: '2px solid #351129',
                  backgroundImage: 'none',
                  bgcolor: '#FDE047',
                  boxShadow: '4px 5px 0 #351129',
                }}
              >
                ส่งข้อความ
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
