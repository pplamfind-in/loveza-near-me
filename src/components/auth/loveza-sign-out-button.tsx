'use client';

import type { ButtonProps } from '@mui/material/Button';
import type { IconButtonProps } from '@mui/material/IconButton';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { signOut } from 'src/auth/context/supabase/action';

type LovezaSignOutButtonProps = {
  iconOnly?: boolean;
  confirm?: boolean;
  label?: string;
  buttonProps?: ButtonProps;
  iconButtonProps?: IconButtonProps;
};

export function LovezaSignOutButton({
  iconOnly = false,
  confirm = false,
  label = 'ออกจากระบบ',
  buttonProps,
  iconButtonProps,
}: LovezaSignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);

    try {
      await signOut();

      // A hard navigation clears persisted App Router layouts and all user-only UI immediately.
      window.location.replace('/');
    } catch (error) {
      console.error('[auth] sign out failed', error);
      setLoading(false);
      toast.error('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง');
    }
  };

  const handleClick = () => {
    if (confirm) {
      setConfirmOpen(true);
      return;
    }

    void handleSignOut();
  };

  const confirmDialog = confirm ? (
    <Dialog
      open={confirmOpen}
      onClose={loading ? undefined : () => setConfirmOpen(false)}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            width: 'calc(100% - 32px)',
            maxWidth: 360,
            overflow: 'visible',
            border: '3px solid #351129',
            borderRadius: '28px',
            boxShadow: '8px 9px 0 #351129',
          },
        },
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          mx: 'auto',
          mt: -4,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          border: '3px solid #351129',
          borderRadius: '20px',
          bgcolor: '#E5007E',
          boxShadow: '4px 4px 0 #351129',
          transform: 'rotate(-4deg)',
        }}
      >
        <Iconify icon="ri:logout-box-r-line" width={31} />
      </Box>
      <DialogTitle sx={{ pt: 2.5, pb: 1, textAlign: 'center', fontSize: 27, fontWeight: 1000 }}>
        ออกจากระบบใช่ไหม?
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
          คุณจะต้องเข้าสู่ระบบด้วย Google อีกครั้ง เมื่อต้องการแจ้งพิกัดหรือตรวจสอบประวัติ
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{ px: 3, pb: 3, gap: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}
      >
        <Button fullWidth color="inherit" disabled={loading} onClick={() => setConfirmOpen(false)}>
          อยู่ต่อ
        </Button>
        <Button
          fullWidth
          variant="contained"
          disabled={loading}
          onClick={() => void handleSignOut()}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{
            color: '#fff',
            border: '2px solid #351129',
            backgroundImage: 'none',
            bgcolor: '#E5007E',
            boxShadow: '4px 5px 0 #351129',
            '&:hover': { bgcolor: '#B80065', boxShadow: '2px 3px 0 #351129' },
          }}
        >
          {loading ? 'กำลังออกจากระบบ' : 'ยืนยันออกจากระบบ'}
        </Button>
      </DialogActions>
    </Dialog>
  ) : null;

  if (iconOnly) {
    return (
      <>
        <IconButton
          {...iconButtonProps}
          disabled={loading || iconButtonProps?.disabled}
          onClick={handleClick}
          aria-label={label}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <Iconify icon="ri:logout-box-r-line" width={22} />
          )}
        </IconButton>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <Button
        {...buttonProps}
        disabled={loading || buttonProps?.disabled}
        onClick={handleClick}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
      >
        {loading ? 'กำลังออกจากระบบ' : label}
      </Button>
      {confirmDialog}
    </>
  );
}
