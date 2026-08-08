import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Logo } from 'src/components/logo';

export function FooterSection() {
  return (
    <Box component="footer" id="contact" sx={{ px: 0, pb: { xs: 11, md: 3 } }}>
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: { xs: 2.5, md: 4 },
            py: { xs: 4, md: 3 },
            color: '#fff',
            border: '3px solid #351129',
            borderRadius: { xs: '28px', md: '34px' },
            background: 'linear-gradient(135deg, #4B2440, #72003F)',
            boxShadow: '7px 8px 0 #E5007E',
          }}
        >
          <Logo sx={{ width: 68, height: 64 }} />
          <Stack direction="row" spacing={{ xs: 2, sm: 4 }}>
            <Link href="/#about" color="inherit" underline="hover">
              เรื่องของเรา
            </Link>
            <Link href="/#flavors" color="inherit" underline="hover">
              รสชาติ
            </Link>
            <Link href="/nearby" color="inherit" underline="hover">
              ค้นหาร้าน
            </Link>
            <Link href="/report" color="inherit" underline="hover">
              แจ้งพิกัด
            </Link>
          </Stack>
          <Typography sx={{ color: '#FFD9ED', fontSize: 13 }}>
            © 2026 LOVEZA LOVE POTION. 330 ML.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
