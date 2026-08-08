'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { adminLoginAction, type AdminLoginState } from 'src/app/auth/admin/actions';

const initialState: AdminLoginState = { error: null };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

  return (
    <Stack component="form" action={formAction} spacing={2.25}>
      {state.error && <Alert severity="error">{state.error}</Alert>}
      <TextField
        required
        fullWidth
        name="username"
        label="Username"
        autoComplete="username"
      />
      <TextField
        required
        fullWidth
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
      />
      <Button
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={pending}
        sx={{ py: 1.5, borderRadius: 99, bgcolor: '#55296f', '&:hover': { bgcolor: '#432055' } }}
      >
        เข้าสู่ระบบ Admin
      </Button>
      <Typography sx={{ color: '#8a9290', fontSize: 12, lineHeight: 1.6 }}>
        Session จะถูกจัดเก็บใน secure cookie และระบบจะตรวจสอบสิทธิ์ Admin ซ้ำทุกครั้ง
      </Typography>
    </Stack>
  );
}
