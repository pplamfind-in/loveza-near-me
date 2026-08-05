'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { signIn } from './actions';

// ----------------------------------------------------------------------

export function AdminSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn(email, password);

    setLoading(false);

    if (result.error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      return;
    }

    router.refresh();
  }

  return (
    <Card variant="outlined" sx={{ p: 3 }}>
      <Stack component="form" onSubmit={handleSubmit} spacing={2}>
        <TextField
          label="อีเมล"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          fullWidth
        />
        <TextField
          label="รหัสผ่าน"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          fullWidth
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" size="large" loading={loading} fullWidth>
          เข้าสู่ระบบ
        </Button>
      </Stack>
    </Card>
  );
}
