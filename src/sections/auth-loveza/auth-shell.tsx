import Image from 'next/image';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Logo } from 'src/components/logo';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100svh',
        position: 'relative',
        isolation: 'isolate',
        bgcolor: 'background.default',
      }}
    >
      <Image
        fill
        priority
        sizes="100vw"
        src="/assets/loveza/login-welcome-v1.webp"
        alt=""
        style={{ objectFit: 'cover', objectPosition: 'right center', zIndex: -2 }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background: {
            xs: 'linear-gradient(180deg, rgba(251,246,237,.97) 0%, rgba(251,246,237,.95) 65%, rgba(251,246,237,.65) 100%)',
            md: 'linear-gradient(90deg, var(--palette-background-default) 0%, rgba(251,246,237,.96) 24%, rgba(251,246,237,.82) 40%, rgba(251,246,237,.08) 66%, transparent 100%)',
          },
        }}
      />
      <Container
        maxWidth="lg"
        sx={{ minHeight: '100svh', display: 'flex', alignItems: 'center', py: { xs: 4, md: 6 } }}
      >
        <Stack
          sx={{
            width: 1,
            maxWidth: { xs: 460, md: 440 },
            mx: { xs: 'auto', md: 0 },
            '& a:focus-visible, & button:focus-visible': {
              outline: '3px solid var(--palette-primary-main)',
              outlineOffset: 4,
            },
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Logo sx={{ width: 68, height: 64 }} />
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>
                LOVEZA{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  HUNT
                </Box>
              </Typography>
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: 10,
                  letterSpacing: 1,
                  color: 'text.secondary',
                  fontWeight: 700,
                }}
              >
                FIND · SHARE · GET FIZZY
              </Typography>
            </Box>
          </Stack>
          <Typography
            sx={{
              mt: { xs: 4, md: 5 },
              color: 'primary.main',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            {eyebrow}
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 1.5,
              fontSize: { xs: 34, md: 42 },
              lineHeight: 1.3,
              fontWeight: 900,
              letterSpacing: '-.03em',
              overflowWrap: 'anywhere',
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: 14, lineHeight: 1.85 }}>
            {description}
          </Typography>
          <Box sx={{ mt: 3.5 }}>{children}</Box>
        </Stack>
      </Container>
    </Box>
  );
}
