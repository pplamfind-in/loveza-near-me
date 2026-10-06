'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" onClick={reset}>
          ลองอีกครั้ง
        </Button>
      }
    >
      โหลดหน้ากระทู้ไม่สำเร็จ กรุณาลองใหม่
    </Alert>
  );
}
