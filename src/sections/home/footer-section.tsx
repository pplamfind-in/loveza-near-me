import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { getBrandOwnerNotice, getBrandOwnerStatusLabel } from 'src/lib/brand-owner-notice';

import { Logo } from 'src/components/logo';

const links = [
  { label: 'ประกาศจากระบบ', href: '/announcements' },
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
      sx={{
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
        pb: { xs: 'calc(88px + env(safe-area-inset-bottom))', md: 2.5 },
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={{ xs: 1.5, md: 3 }}
          sx={{ py: { xs: 2, md: 2.5 } }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Logo sx={{ width: 78, height: 48, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {getBrandOwnerStatusLabel(brandOwnerAcknowledged)}
            </Typography>
          </Stack>

          <Box
            component="nav"
            aria-label="เมนูท้ายเว็บไซต์"
            sx={{
              display: { xs: 'grid', sm: 'flex' },
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))' },
              flexWrap: 'wrap',
              justifyContent: { md: 'flex-end' },
              columnGap: { xs: 2, md: 2.25 },
              rowGap: 0.25,
              width: { xs: '100%', md: 'auto' },
            }}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                color="inherit"
                underline="hover"
                sx={{ py: 0.75, fontSize: 13, fontWeight: 700, width: 'fit-content' }}
              >
                {link.label}
              </Link>
            ))}
          </Box>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ md: 'baseline' }}
          justifyContent="space-between"
          gap={{ xs: 1, md: 3 }}
          sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.75 }}>
            {getBrandOwnerNotice(brandOwnerAcknowledged, true)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            © {new Date().getFullYear()} LOVEZA HUNT
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
