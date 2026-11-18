'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { updateAccountAvatar } from 'src/app/account/actions';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

export function AvatarPicker({
  options,
  current,
  googleAvatar,
  name,
}: {
  options: string[];
  current: string;
  googleAvatar: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(current);
  const [saved, setSaved] = useState(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const { checkUserSession } = useAuthContext();
  const router = useRouter();
  const save = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      const result = await updateAccountAvatar(selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(selected);
      await checkUserSession?.();
      router.refresh();
      setOpen(false);
    } catch {
      setError('บันทึกรูปไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <Box
        sx={{
          position: 'relative',
          flexShrink: 0,
          mt: 1,
          mb: 1,
          overflow: 'visible',
          '&::before': {
            content: '"✦"',
            position: 'absolute',
            top: 0,
            right: -18,
            color: 'secondary.main',
            fontSize: 24,
          },
          '&::after': {
            content: '"✧"',
            position: 'absolute',
            bottom: 8,
            left: -20,
            color: 'primary.light',
            fontSize: 20,
          },
        }}
      >
        <IconButton
          aria-label="เปลี่ยนรูปโปรไฟล์"
          onClick={() => {
            setSelected(saved);
            setError('');
            setOpen(true);
          }}
          sx={{
            p: 0.75,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            border: '2px solid',
            borderColor: 'primary.light',
            overflow: 'visible',
            flexShrink: 0,
            '&:focus-visible': {
              outline: '2px solid var(--palette-primary-main)',
              outlineOffset: 4,
            },
            boxShadow: '0 5px 0 var(--palette-grey-200), 0 10px 24px rgba(66,118,83,.12)',
          }}
        >
          <Avatar
            src={saved || googleAvatar}
            alt={name}
            imgProps={{ referrerPolicy: 'no-referrer' }}
            sx={{
              width: { xs: 108, md: 120 },
              height: { xs: 108, md: 120 },
              bgcolor: 'primary.lighter',
              color: 'primary.dark',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
        <Box
          aria-hidden="true"
          sx={{
            pointerEvents: 'none',
            position: 'absolute',
            bottom: -2,
            right: -2,
            display: 'grid',
            placeItems: 'center',
            width: 32,
            height: 32,
            border: '2px solid',
            borderColor: 'background.paper',
            borderRadius: '8px',
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          <Iconify icon="ri:camera-line" width={18} />
        </Box>
      </Box>
      <Dialog
        open={open}
        onClose={pending ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="avatar-picker-title"
        slotProps={{
          paper: {
            sx: { borderRadius: '18px', border: '5px solid var(--palette-background-paper)' },
          },
        }}
      >
        <DialogTitle id="avatar-picker-title">เลือกเพื่อนนักสำรวจของคุณ</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontSize: 13, color: 'text.secondary' }}>
            เลือกรูปที่ชอบ แล้วออกตามหาความซ่าไปด้วยกัน
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
            {['', ...options].map((url, index) => (
              <Button
                key={url || 'google'}
                disabled={pending}
                aria-label={url ? `เลือกรูปนักสำรวจ ${index}` : 'ใช้รูปจาก Google'}
                aria-pressed={selected === url}
                onClick={() => setSelected(url)}
                sx={{
                  p: 1,
                  minWidth: 0,
                  flexDirection: 'column',
                  gap: 0.75,
                  borderRadius: '14px',
                  border: '2px solid',
                  borderColor: selected === url ? 'primary.main' : 'divider',
                  bgcolor: selected === url ? 'primary.lighter' : 'background.default',
                }}
              >
                <Avatar
                  src={url || googleAvatar}
                  alt=""
                  imgProps={{ referrerPolicy: 'no-referrer' }}
                  sx={{ width: 60, height: 60 }}
                >
                  {name.charAt(0)}
                </Avatar>
              </Button>
            ))}
          </Box>
          {options.length === 0 && (
            <Typography sx={{ mt: 2, fontSize: 13, color: 'text.secondary' }}>
              รูปนักสำรวจใหม่กำลังมา ระหว่างนี้ใช้รูป Google ได้เลย
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" disabled={pending} onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button variant="contained" disabled={pending || selected === saved} onClick={save}>
            {pending ? 'กำลังบันทึก' : 'ใช้รูปนี้'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
