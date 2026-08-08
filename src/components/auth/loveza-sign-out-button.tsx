'use client';

import type { ButtonProps } from '@mui/material/Button';
import type { IconButtonProps } from '@mui/material/IconButton';

import { useState } from 'react';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { signOut } from 'src/auth/context/supabase/action';

type LovezaSignOutButtonProps = {
  iconOnly?: boolean;
  label?: string;
  buttonProps?: ButtonProps;
  iconButtonProps?: IconButtonProps;
};

export function LovezaSignOutButton({
  iconOnly = false,
  label = 'ออกจากระบบ',
  buttonProps,
  iconButtonProps,
}: LovezaSignOutButtonProps) {
  const [loading, setLoading] = useState(false);

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

  if (iconOnly) {
    return (
      <IconButton
        {...iconButtonProps}
        disabled={loading || iconButtonProps?.disabled}
        onClick={handleSignOut}
        aria-label={label}
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <Iconify icon="ri:logout-box-r-line" width={22} />
        )}
      </IconButton>
    );
  }

  return (
    <Button
      {...buttonProps}
      disabled={loading || buttonProps?.disabled}
      onClick={handleSignOut}
      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
    >
      {loading ? 'กำลังออกจากระบบ' : label}
    </Button>
  );
}
