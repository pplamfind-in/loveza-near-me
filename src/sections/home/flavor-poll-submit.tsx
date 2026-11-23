'use client';

import { useFormStatus } from 'react-dom';

import Button from '@mui/material/Button';

export function FlavorPollSubmit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="contained"
      disabled={disabled}
      loading={pending}
      loadingPosition="start"
      sx={{
        bgcolor: 'common.white',
        color: 'var(--activity-primary)',
        '&:hover': { bgcolor: 'common.white', filter: 'brightness(.94)' },
        '&.Mui-disabled': {
          bgcolor: 'color-mix(in srgb, var(--activity-contrast) 16%, transparent)',
          color: 'var(--activity-contrast)',
        },
        alignSelf: 'stretch',
        width: '100%',
        px: 3,
        borderRadius: '14px',
        minHeight: 48,
      }}
    >
      {pending ? 'กำลังส่งโหวต' : 'ส่งโหวต'}
    </Button>
  );
}
