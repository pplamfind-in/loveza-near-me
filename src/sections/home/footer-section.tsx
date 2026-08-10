import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Logo } from 'src/components/logo';
import { getBrandOwnerNotice, getBrandOwnerStatusLabel } from 'src/lib/brand-owner-notice';

const links = [
  { label: 'เกี่ยวกับเรา', href: '/about-us' },
  { label: 'ข้อกำหนด', href: '/terms' },
  { label: 'ความเป็นส่วนตัว', href: '/privacy' },
  { label: 'แนวทางชุมชน', href: '/community-guidelines' },
  { label: 'ติดต่อเรา', href: '/contact-us' },
];

type FooterSectionProps = {
  brandOwnerAcknowledged: boolean;
};

export function FooterSection({ brandOwnerAcknowledged }: FooterSectionProps) {
  return (
    <Box
      component="footer"
      id="contact"
      sx={{ px: 0, pb: { xs: 'calc(100px + env(safe-area-inset-bottom))', md: 3 } }}
    >
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
          <Stack spacing={1.5} alignItems={{ xs: 'center', md: 'flex-end' }}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: { xs: 2, sm: 3 },
              }}
            >
              {links.map((link) => (
                <Link key={link.href} href={link.href} color="inherit" underline="hover">
                  {link.label}
                </Link>
              ))}
            </Box>
            <Typography sx={{ color: '#FFD9ED', fontSize: 11, fontWeight: 800 }}>
              {getBrandOwnerStatusLabel(brandOwnerAcknowledged)}
            </Typography>
          </Stack>
        </Stack>
        <Typography
          sx={{
            mt: 3,
            px: 2,
            color: '#6F4A61',
            fontSize: 11,
            lineHeight: 1.7,
            textAlign: 'center',
          }}
        >
          {getBrandOwnerNotice(brandOwnerAcknowledged, true)} © {new Date().getFullYear()} LOVEZA
          HUNT.
        </Typography>
      </Container>
    </Box>
  );
}
