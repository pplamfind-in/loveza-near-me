import type { Breakpoint } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { getBrandOwnerNotice, getBrandOwnerStatusLabel } from 'src/lib/brand-owner-notice';

import { Logo } from 'src/components/logo';

const FOOTER_LINKS = [
  { name: 'เกี่ยวกับเรา', href: paths.about },
  { name: 'ข้อกำหนดการใช้งาน', href: paths.terms },
  { name: 'ความเป็นส่วนตัว', href: paths.privacy },
  { name: 'นโยบายคุกกี้', href: paths.cookies },
  { name: 'แนวทางชุมชน', href: paths.communityGuidelines },
  { name: 'ติดต่อเรา', href: paths.contact },
];

const FooterRoot = styled('footer')({
  position: 'relative',
  color: '#fff',
  background: 'linear-gradient(135deg, #4B2440, #72003F)',
});

export type FooterProps = React.ComponentProps<typeof FooterRoot> & {
  brandOwnerAcknowledged?: boolean;
};

export function Footer({
  sx,
  layoutQuery = 'md',
  brandOwnerAcknowledged = false,
  ...other
}: FooterProps & { layoutQuery?: Breakpoint }) {
  return (
    <FooterRoot sx={sx} {...other}>
      <Container
        sx={{
          pt: { xs: 5, md: 6 },
          pb: { xs: 'calc(100px + env(safe-area-inset-bottom))', md: 6 },
        }}
      >
        <Stack
          direction={{ xs: 'column', [layoutQuery]: 'row' }}
          spacing={3}
          alignItems={{ xs: 'flex-start', [layoutQuery]: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Logo sx={{ width: 56, height: 52 }} />
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 1000 }}>LOVEZA HUNT</Typography>
              <Typography sx={{ color: '#FFD9ED', fontSize: 12, fontWeight: 800 }}>
                {getBrandOwnerStatusLabel(brandOwnerAcknowledged)}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2.5 } }}>
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.name}
                component={RouterLink}
                href={link.href}
                color="inherit"
                variant="body2"
                underline="hover"
              >
                {link.name}
              </Link>
            ))}
          </Box>
        </Stack>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,.18)' }}>
          <Typography sx={{ maxWidth: 920, color: '#FFD9ED', fontSize: 12, lineHeight: 1.7 }}>
            {getBrandOwnerNotice(brandOwnerAcknowledged)}
          </Typography>
          <Typography sx={{ mt: 2, color: '#FFD9ED', fontSize: 12 }}>
            © {new Date().getFullYear()} LOVEZA HUNT. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </FooterRoot>
  );
}

export function HomeFooter(props: FooterProps) {
  return <Footer {...props} />;
}
