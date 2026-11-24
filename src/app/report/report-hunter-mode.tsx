'use client';

import { useRef, useState, useEffect, useCallback, useTransition } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { switchAccountMode } from 'src/app/account/actions';

export function ReportHunterMode() {
  const started = useRef(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const switchToHunter = useCallback(() => {
    startTransition(async () => {
      setError('');
      try {
        const result = await switchAccountMode('hunter');
        if (result.error) setError(result.error);
      } catch {
        setError('สลับเป็นโหมดนักล่าไม่สำเร็จ');
      }
    });
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    switchToHunter();
  }, [switchToHunter]);

  if (!error) return null;

  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Button size="small" color="inherit" onClick={switchToHunter} loading={pending}>
          ลองใหม่
        </Button>
      }
    >
      {error}
    </Alert>
  );
}
