import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export function FooterSection() {
  return (
    <Box component="footer" id="contact" sx={{ py: 5 }}>
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
          <Typography sx={{ color: '#00a99d', fontSize: 25, fontWeight: 1000, letterSpacing: '-.06em' }}>
            LOVE ZA<span style={{ color: '#ef2382' }}>!</span>
          </Typography>
          <Stack direction="row" spacing={{ xs: 2, sm: 4 }}>
            <Link href="/#about" color="inherit" underline="hover">เรื่องของเรา</Link>
            <Link href="/#flavors" color="inherit" underline="hover">รสชาติ</Link>
            <Link href="/nearby" color="inherit" underline="hover">ค้นหาร้าน</Link>
            <Link href="/report" color="inherit" underline="hover">แจ้งพิกัด</Link>
          </Stack>
          <Typography sx={{ color: '#8c9389', fontSize: 13 }}>© 2026 LOVEZA LOVE POTION. 330 ML.</Typography>
        </Stack>
      </Container>
    </Box>
  );
}
