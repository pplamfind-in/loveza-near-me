'use client';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { SimpleLayout } from 'src/layouts/simple';

import { varBounce, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

export function NotFoundView() {
  return (
    <SimpleLayout
      slotProps={{
        content: { compact: true },
      }}
    >
      <Container component={MotionContainer}>
        <m.div variants={varBounce('in')}>
          <Typography component="h1" variant="h3" sx={{ mb: 2 }}>
            ไม่พบหน้านี้
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <Typography sx={{ color: 'text.secondary' }}>
            ลิงก์นี้อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายไปแล้ว
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <Box
            component="img"
            src="/assets/illustrations/p-kard-heart.webp"
            alt=""
            draggable={false}
            onContextMenu={(event) => event.preventDefault()}
            sx={{
              display: 'block',
              width: { xs: 180, sm: 240 },
              height: 'auto',
              mx: 'auto',
              my: { xs: 4, sm: 5 },
            }}
          />
        </m.div>

        <Button component={RouterLink} href="/" size="large" variant="contained">
          กลับหน้าแรก
        </Button>
      </Container>
    </SimpleLayout>
  );
}
