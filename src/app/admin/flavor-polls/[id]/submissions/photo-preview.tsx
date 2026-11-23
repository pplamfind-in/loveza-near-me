'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

export function PhotoPreview({ src, author }: { src: string; author?: string }) {
  const [open, setOpen] = useState(false);
  const description = author ? `ภาพที่ส่งโดย ${author}` : 'ภาพที่ส่งเข้าร่วมกิจกรรม';

  return (
    <Box>
      <ButtonBase
        aria-haspopup="dialog"
        aria-label={`ดู${description}`}
        onClick={() => setOpen(true)}
        sx={{
          display: 'block',
          width: 1,
          borderRadius: 1,
          cursor: 'zoom-in',
          '&.Mui-focusVisible': { outline: '2px solid currentColor', outlineOffset: 2 },
        }}
      >
        <Box
          component="img"
          src={src}
          alt=""
          loading="lazy"
          sx={{ display: 'block', width: 1, aspectRatio: 1, objectFit: 'cover', borderRadius: 1 }}
        />
      </ButtonBase>
      <Dialog open={open} onClose={() => setOpen(false)} aria-label={description} maxWidth="md">
        <DialogContent sx={{ position: 'relative', p: 1 }}>
          <IconButton
            aria-label="ปิดภาพ"
            onClick={() => setOpen(false)}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' },
              boxShadow: 2,
            }}
          >
            <Iconify icon="ri:close-line" width={22} />
          </IconButton>
          <Box
            component="img"
            src={src}
            alt={description}
            sx={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: 'calc(100dvh - 80px)',
              objectFit: 'contain',
              borderRadius: 1,
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
