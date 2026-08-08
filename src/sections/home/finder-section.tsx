import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

const finderSteps = [
  {
    number: '01',
    title: 'ค้นหาจาก GPS',
    body: 'เปิดตำแหน่งบนมือถือ เพื่อดูร้านที่มี Loveza ใกล้คุณ เรียงตามระยะทาง',
    color: '#00a99d',
  },
  {
    number: '02',
    title: 'พบแล้วช่วยบอกต่อ',
    body: 'เข้าสู่ระบบด้วย Google แล้วแจ้งร้าน รสชาติ และจำนวนสินค้าที่พบได้ทันที',
    color: '#ef2382',
  },
  {
    number: '03',
    title: 'ข้อมูลที่เชื่อถือได้',
    body: 'ข้อมูลเก็บลงฐานข้อมูลและผ่านการตรวจสอบจาก Admin ก่อนช่วยคนอื่นตามไปซื้อ',
    color: '#6a40a5',
  },
];

const stores = [
  { name: 'Mini Mart — อโศก', distance: '350 ม.', stock: 'เหลือเยอะ', color: '#00a99d' },
  { name: 'Fresh Shop — พร้อมพงษ์', distance: '1.2 กม.', stock: 'เหลือปานกลาง', color: '#f2a900' },
];

function MapPreview() {
  return (
    <Box
      sx={{
        minHeight: { xs: 410, md: 500 },
        p: { xs: 2, sm: 3 },
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: { xs: '26px', md: '36px' },
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundColor: '#dff5f8',
        backgroundImage: `
          linear-gradient(31deg, transparent 48%, rgba(255,255,255,.9) 49%, rgba(255,255,255,.9) 54%, transparent 55%),
          linear-gradient(121deg, transparent 43%, rgba(255,255,255,.72) 44%, rgba(255,255,255,.72) 49%, transparent 50%),
          linear-gradient(rgba(0,169,157,.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,169,157,.08) 1px, transparent 1px)
        `,
        backgroundSize: 'auto, auto, 48px 48px, 48px 48px',
      }}
    >
      <Box
        sx={{
          top: 20,
          left: 20,
          zIndex: 2,
          px: 1.5,
          py: 0.75,
          display: 'flex',
          gap: 0.75,
          position: 'absolute',
          alignItems: 'center',
          borderRadius: 99,
          bgcolor: 'rgba(255,255,255,.88)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Iconify icon="ri:map-2-fill" width={16} sx={{ color: '#00a99d' }} />
        <Typography sx={{ fontSize: 11, fontWeight: 900 }}>ตัวอย่างหน้าค้นหา</Typography>
      </Box>
      {[
        { top: '15%', left: '23%', color: '#ef2382' },
        { top: '27%', right: '19%', color: '#6a40a5' },
        { top: '44%', left: '48%', color: '#00a99d' },
      ].map((pin, index) => (
        <Box
          key={index}
          sx={{
            ...pin,
            width: 42,
            height: 42,
            display: 'grid',
            color: '#fff',
            position: 'absolute',
            placeItems: 'center',
            borderRadius: '50% 50% 50% 8px',
            bgcolor: pin.color,
            border: '4px solid #fff',
            transform: 'rotate(-45deg)',
            boxShadow: '0 12px 24px rgba(50,70,80,.2)',
          }}
        >
          <Box component="span" sx={{ fontWeight: 1000, transform: 'rotate(45deg)' }}>
            LZ
          </Box>
        </Box>
      ))}

      <Box
        sx={{
          top: '38%',
          left: '37%',
          width: 18,
          height: 18,
          position: 'absolute',
          borderRadius: '50%',
          bgcolor: '#2589ff',
          border: '4px solid #fff',
          boxShadow: '0 0 0 9px rgba(37,137,255,.16)',
        }}
      />

      <Stack spacing={1.25} sx={{ zIndex: 1 }}>
        {stores.map((store) => (
          <Stack
            key={store.name}
            direction="row"
            alignItems="center"
            sx={{ p: 1.6, borderRadius: '18px', bgcolor: 'rgba(255,255,255,.94)', boxShadow: '0 12px 30px rgba(61,96,107,.12)' }}
          >
            <Box sx={{ width: 10, height: 10, mr: 1.5, borderRadius: '50%', bgcolor: store.color }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{store.name}</Typography>
              <Typography sx={{ mt: 0.25, color: '#718078', fontSize: 12 }}>อัปเดตล่าสุด 12 นาทีที่แล้ว</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ color: '#55296f', fontSize: 12, fontWeight: 900 }}>{store.distance}</Typography>
              <Typography sx={{ color: store.color, fontSize: 11, fontWeight: 800 }}>{store.stock}</Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export function FinderSection() {
  return (
    <Box component="section" id="finder" sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 4, md: 8 }, pb: { xs: 4, md: 6 } }}>
      <Container
        maxWidth="xl"
        sx={{
          p: { xs: '30px 20px !important', sm: '48px !important', md: '72px !important' },
          overflow: 'hidden',
          borderRadius: { xs: '30px', md: '44px' },
          background: 'linear-gradient(135deg, #f3fbfc 0%, #fff5fa 54%, #f5f0fb 100%)',
          boxShadow: '0 30px 80px rgba(74,68,110,.12)',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 5, md: 8 },
            alignItems: 'center',
            gridTemplateColumns: { xs: '1fr', md: '.9fr 1.1fr' },
          }}
        >
          <Box>
            <Typography sx={{ color: '#00a99d', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
              LOVEZA NEAR ME
            </Typography>
            <Typography
              component="h2"
              sx={{ mt: 2, fontSize: { xs: 44, md: 68 }, lineHeight: .98, fontWeight: 900, letterSpacing: '-.06em' }}
            >
              ตามหา Loveza
              <Box component="span" sx={{ display: 'block', color: '#ef2382' }}>
                ใกล้คุณ
              </Box>
            </Typography>
            <Typography sx={{ mt: 3, maxWidth: 500, color: '#5f6170', fontSize: 17, lineHeight: 1.8 }}>
              ไม่ต้องเดินหาร้านแบบเดาสุ่ม เปิด GPS เพื่อดูว่าร้านไหนมี Loveza ขาย อยู่ห่างเท่าไร
              และเหลือสินค้าแค่ไหน จากข้อมูลที่ Community ช่วยกันอัปเดต
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
              <Button
                href="/nearby"
                variant="contained"
                startIcon={<Iconify icon="ri:navigation-fill" />}
                sx={{ px: 3, py: 1.45, borderRadius: 99, bgcolor: '#ef2382', '&:hover': { bgcolor: '#d91873' } }}
              >
                ค้นหาใกล้ฉัน
              </Button>
              <Button
                href="/report"
                startIcon={<Iconify icon="ri:edit-2-fill" />}
                sx={{ px: 3, py: 1.45, color: '#55296f', borderRadius: 99 }}
              >
                เจอ Loveza แจ้งพิกัด
              </Button>
            </Stack>

            <Stack direction="row" spacing={2.5} sx={{ mt: 4, color: '#6c7080' }}>
              <Stack direction="row" spacing={0.6} alignItems="center">
                <Iconify icon="ri:smartphone-fill" width={16} sx={{ color: '#00a99d' }} />
                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>GPS บนมือถือ</Typography>
              </Stack>
              <Stack direction="row" spacing={0.6} alignItems="center">
                <Iconify icon="ri:time-fill" width={16} sx={{ color: '#ef2382' }} />
                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>ข้อมูลสต็อกล่าสุด</Typography>
              </Stack>
            </Stack>
          </Box>

          <MapPreview />
        </Box>

        <Box id="how-it-works" sx={{ pt: { xs: 8, md: 10 } }}>
          <Typography sx={{ textAlign: 'center', color: '#6a40a5', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
            HOW IT WORKS
          </Typography>
          <Box
            id="community"
            sx={{ mt: 3, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}
          >
            {finderSteps.map((step) => (
              <Box key={step.number} sx={{ p: { xs: 3, md: 3.5 }, borderRadius: '26px', bgcolor: '#fff' }}>
                <Typography sx={{ color: step.color, fontSize: 13, fontWeight: 900 }}>{step.number}</Typography>
                <Typography sx={{ mt: 3, fontSize: 22, fontWeight: 900 }}>{step.title}</Typography>
                <Typography sx={{ mt: 1, color: '#70747d', lineHeight: 1.7 }}>{step.body}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
