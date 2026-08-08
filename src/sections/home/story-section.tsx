import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

const benefits = [
  { title: 'วิตามินบี', body: 'ผสมวิตามิน B3, B6 และ B12', color: '#ffdd3f', icon: 'B' },
  { title: '330 ml', body: 'กระป๋องสลิม ดื่มง่าย เย็นไว', color: '#82e4dd', icon: '↕' },
  { title: '3 รสชาติ', body: 'เลือกความสดชื่นที่ใช่สำหรับคุณ', color: '#ff9bc9', icon: '3' },
  { title: 'พร้อมส่ง', body: 'เปิดกระป๋อง พร้อมซ่าได้ทันที', color: '#6940a5', icon: '✦' },
];

export function StorySection() {
  return (
    <Box component="section" id="about" sx={{ py: { xs: 10, md: 15 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 6, md: 10 },
            alignItems: 'center',
            gridTemplateColumns: { xs: '1fr', md: '0.88fr 1.12fr' },
          }}
        >
          <Box>
            <Typography sx={{ color: '#00a99d', fontWeight: 800, letterSpacing: 2, fontSize: 12 }}>
              WHY LOVE POTION
            </Typography>
            <Typography
              component="h2"
              sx={{ mt: 1.5, fontSize: { xs: 42, md: 62 }, lineHeight: 1, fontWeight: 900, letterSpacing: '-.055em' }}
            >
              เติมความซ่า
              <br />ด้วยวิตามินบี
            </Typography>
            <Typography sx={{ mt: 3, maxWidth: 480, color: '#5d6659', fontSize: 17, lineHeight: 1.8 }}>
              Loveza Love Potion คือเครื่องดื่มโซดาผสมวิตามิน B3, B6 และ B12
              ในกระป๋องสลิมขนาด 330 ml มีให้เลือก 3 รสชาติ สดชื่น ดื่มง่าย และพร้อมส่ง
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 4 }}>
              {['วิตามิน B3', 'วิตามิน B6', 'วิตามิน B12'].map((item) => (
                <Box
                  key={item}
                  sx={{ px: 2, py: 1, border: '1px solid #dce9ca', borderRadius: 99, color: '#557337', fontSize: 13, fontWeight: 700 }}
                >
                  {item}
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: { xs: 1.5, sm: 2 } }}>
            {benefits.map((item, index) => (
              <Box
                key={item.title}
                sx={{
                  minHeight: { xs: 185, sm: 220 },
                  p: { xs: 2.5, sm: 3.5 },
                  color: index === 3 ? '#fff' : '#26311f',
                  bgcolor: item.color,
                  borderRadius: { xs: '24px', sm: '34px' },
                  transform: index % 2 ? 'translateY(20px)' : 'none',
                  transition: 'transform .25s ease',
                  '&:hover': { transform: index % 2 ? 'translateY(12px)' : 'translateY(-8px)' },
                }}
              >
                <Typography sx={{ fontSize: 34, lineHeight: 1 }}>{item.icon}</Typography>
                <Typography sx={{ mt: 4, fontSize: { xs: 18, sm: 23 }, fontWeight: 900 }}>{item.title}</Typography>
                <Typography sx={{ mt: 0.5, opacity: 0.72 }}>{item.body}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
