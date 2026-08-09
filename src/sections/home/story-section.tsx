import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

const benefits = [
  {
    title: 'วิตามินบี',
    body: 'ผสมวิตามิน B3, B6 และ B12',
    color: '#ffdd3f',
    icon: 'ri:capsule-fill',
  },
  {
    title: '330 ml',
    body: 'กระป๋องสลิม ดื่มง่าย เย็นไว',
    color: '#82e4dd',
    icon: 'ri:drinks-2-fill',
  },
  {
    title: '3 รสชาติ',
    body: 'เลือกความสดชื่นที่ใช่สำหรับคุณ',
    color: '#ff9bc9',
    icon: 'ri:contrast-drop-2-fill',
  },
  {
    title: 'พร้อมส่ง',
    body: 'เปิดกระป๋อง พร้อมซ่าได้ทันที',
    color: '#6940a5',
    icon: 'ri:flashlight-fill',
  },
];

export function StorySection() {
  return (
    <Container maxWidth="xl">
      <Box component="section" id="about" sx={{ py: { xs: 7, md: 6 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: '0 !important', sm: '0 !important' } }}>
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 2, md: 2.5 },
              gridTemplateColumns: { xs: '1fr', md: '0.92fr 1.08fr' },
            }}
          >
            <Box
              sx={{
                p: { xs: 3.5, sm: 5, md: 7 },
                display: 'flex',
                minHeight: { md: 520 },
                border: '3px solid #351129',
                borderRadius: { xs: '30px', md: '42px' },
                flexDirection: 'column',
                justifyContent: 'center',
                background: 'linear-gradient(145deg, #E5007E 0%, #B80065 54%, #7C3AED 130%)',
                boxShadow: '8px 9px 0 #351129',
              }}
            >
              <Typography
                sx={{ color: '#FFD9ED', fontWeight: 900, letterSpacing: 2, fontSize: 12 }}
              >
                WHY LOVE POTION
              </Typography>
              <Typography
                component="h2"
                sx={{
                  mt: 1.5,
                  color: '#fff',
                  fontSize: { xs: 42, md: 62 },
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: '-.055em',
                }}
              >
                ซ่า สนุก
                <br />
                สดใสในแบบคุณ
              </Typography>
              <Typography
                sx={{ mt: 3, maxWidth: 480, color: '#FFEAF5', fontSize: 16, lineHeight: 1.8 }}
              >
                สดชื่น ซ่า เต็มกระป๋อง 💗 Loveza โซดาผสมวิตามิน B3, B6 และ B12 ขนาด 330 มล.
                มีให้เลือก 3 รสชาติ วันนี้เจอ Loveza ใกล้คุณหรือยัง?
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 4 }}>
                {['วิตามิน B3', 'วิตามิน B6', 'วิตามิน B12'].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      px: 2,
                      py: 1,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 800,
                      border: '1px solid rgba(255,255,255,.3)',
                      borderRadius: 99,
                      bgcolor: 'rgba(255,255,255,.1)',
                    }}
                  >
                    {item}
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {benefits.map((item, index) => (
                <Box
                  key={item.title}
                  sx={{
                    minHeight: { xs: 175, sm: 250 },
                    p: { xs: 2.5, sm: 3.5 },
                    color: index === 3 ? '#fff' : '#26311f',
                    bgcolor: item.color,
                    border: '3px solid #351129',
                    borderRadius: { xs: '26px', sm: '34px' },
                    boxShadow: '5px 6px 0 #351129',
                    transition: 'transform .25s ease',
                    '&:hover': { transform: 'translateY(-6px)' },
                  }}
                >
                  <Iconify icon={item.icon} width={34} />
                  <Typography
                    sx={{ mt: { xs: 3, sm: 5 }, fontSize: { xs: 18, sm: 23 }, fontWeight: 900 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography sx={{ mt: 0.5, opacity: 0.72 }}>{item.body}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </Container>
  );
}
