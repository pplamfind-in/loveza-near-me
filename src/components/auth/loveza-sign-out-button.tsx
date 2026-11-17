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
  confirmDescription?: string;
  label?: string;
  buttonProps?: ButtonProps;
  iconButtonProps?: IconButtonProps;
};

export function LovezaSignOutButton({
  iconOnly = false,
  confirm = false,
  confirmDescription = 'คุณจะต้องเข้าสู่ระบบด้วย Google อีกครั้ง เมื่อต้องการแจ้งพิกัดหรือตรวจสอบประวัติ',
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
      aria-labelledby="sign-out-title"
      aria-describedby="sign-out-description"
      slotProps={{
        paper: {
          sx: {
            width: 'calc(100% - 32px)',
            maxWidth: 360,
            overflow: 'hidden',
            border: '5px solid var(--palette-background-paper)',
            borderRadius: '18px',
            bgcolor: 'background.paper',
            boxShadow: '0 6px 0 var(--palette-grey-200), 0 24px 60px rgba(35,63,43,.15)',
          },
        },
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          mx: 'auto',
          mt: 3,
          color: 'primary.dark',
          display: 'grid',
          placeItems: 'center',
          borderRadius: '14px',
          bgcolor: 'primary.lighter',
        }}
      >
        <Iconify icon="ri:logout-box-r-line" width={26} />
      </Box>
      <DialogTitle
        id="sign-out-title"
        sx={{ pt: 2, pb: 1, textAlign: 'center', fontSize: 23, fontWeight: 800 }}
      >
        ออกจากระบบใช่ไหม?
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography
          id="sign-out-description"
          sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.8 }}
        >
          {confirmDescription}
        </Typography>
      </DialogContent>
      <DialogActions
        disableSpacing
        sx={{
          px: 2.5,
          pb: 2.5,
          pt: 1,
          gap: 1,
          '& .MuiButton-root': { borderRadius: '12px', minHeight: 44 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
        }}
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
            color: 'primary.contrastText',
            backgroundImage: 'none',
            bgcolor: 'primary.main',
            boxShadow: '0 3px 0 var(--palette-primary-darker)',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: '0 3px 0 var(--palette-primary-darker)',
            },
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
