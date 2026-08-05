'use client';

import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';

// ----------------------------------------------------------------------

type MobileHeaderProps = {
  title: string;
  showBack?: boolean;
};

export function MobileHeader({ title, showBack }: MobileHeaderProps) {
  const router = useRouter();

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, minHeight: 44 }}>
      {showBack && (
        <IconButton onClick={() => router.back()} aria-label="ย้อนกลับ" edge="start">
          <ArrowBackRounded />
        </IconButton>
      )}
      <Box>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
      </Box>
    </Stack>
  );
}
