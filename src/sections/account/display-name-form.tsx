'use client';

import type { DisplayNameState } from 'src/app/account/actions';

import { useState, useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { updateDisplayName } from 'src/app/account/actions';

import { useAuthContext } from 'src/auth/hooks';

export function DisplayNameForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const { checkUserSession } = useAuthContext();
  const [state, action, pending] = useActionState(
    async (previous: DisplayNameState, form: FormData) => {
      const result = await updateDisplayName(previous, form);
      if (result.success) await checkUserSession?.();
      return result;
    },
    {}
  );
  return (
    <Stack
      component="form"
      action={action}
      spacing={1.5}
      sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'left' }}
    >
      <Typography variant="subtitle2">ชื่อที่แสดงใน Loveza</Typography>
      <TextField
        label="ชื่อแสดงผล"
        name="display_name"
        size="small"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        disabled={pending}
        slotProps={{ htmlInput: { minLength: 2, maxLength: 60 } }}
        helperText="ใช้ในกระทู้ ความคิดเห็น และชื่อผู้แจ้งพิกัด"
      />
      {state.error && <Alert severity="error">{state.error}</Alert>}
      {state.success && <Alert severity="success">{state.success}</Alert>}
      <Button
        variant="contained"
        type="submit"
        disabled={pending || name.trim() === currentName}
        sx={{ alignSelf: 'flex-end' }}
      >
        {pending ? 'กำลังบันทึก…' : 'บันทึกชื่อ'}
      </Button>
    </Stack>
  );
}
