'use client';

import type { AccountMode } from 'src/auth/utils/account-mode';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { switchAccountMode } from 'src/app/account/actions';

import { Iconify } from 'src/components/iconify';

export function AccountModeSwitch({ mode }: { mode: AccountMode }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <ToggleButtonGroup
        value={mode}
        exclusive
        disabled={pending}
        fullWidth
        size="small"
        aria-label="โหมดบัญชี"
        onChange={(_, selected: AccountMode | null) => {
          if (!selected || selected === mode) return;
          setError('');
          startTransition(async () => {
            try {
              const result = await switchAccountMode(selected);
              if (result.destination) router.replace(result.destination);
              else if (result.error) setError(result.error);
            } catch {
              setError('สลับโหมดไม่สำเร็จ กรุณาลองใหม่');
            }
          });
        }}
        sx={{
          '& .MuiToggleButton-root': {
            minHeight: 44,
            gap: 0.5,
            px: 0.5,
            color: 'text.primary',
            textTransform: 'none',
            '&.Mui-selected': {
              bgcolor: 'primary.lighter',
              color: 'primary.darker',
              fontWeight: 800,
              '&:hover': { bgcolor: 'primary.lighter' },
            },
          },
        }}
      >
        <ToggleButton value="hunter">
          <Iconify icon="ri:compass-3-line" width={16} />
          นักสำรวจ
        </ToggleButton>
        <ToggleButton value="merchant">
          <Iconify icon="ri:store-3-line" width={16} />
          {mode === 'hunter' ? 'ร้านของฉัน' : 'ร้านค้า'}
        </ToggleButton>
      </ToggleButtonGroup>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
