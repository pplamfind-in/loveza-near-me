'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

export function GmailSmtpSettings({
  initialEmail,
  initialConfigured,
  canSave,
}: {
  initialEmail: string;
  initialConfigured: boolean;
  canSave: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(initialConfigured);
  const [showPassword, setShowPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState('');
  const [revealing, setRevealing] = useState(false);
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(
    null
  );

  const togglePassword = async () => {
    if (showPassword) {
      setShowPassword(false);
      setSavedPassword('');
      return;
    }
    if (password) {
      setShowPassword(true);
      return;
    }

    setRevealing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/settings/gmail-smtp/', { cache: 'no-store' });
      const result = (await response.json()) as { password?: string; error?: string };
      if (!response.ok || !result.password) {
        throw new Error(result.error ?? 'เปิดดู App Password ไม่สำเร็จ');
      }
      setSavedPassword(result.password);
      setShowPassword(true);
    } catch (error) {
      setMessage({
        severity: 'error',
        text: error instanceof Error ? error.message : 'เปิดดู App Password ไม่สำเร็จ',
      });
    } finally {
      setRevealing(false);
    }
  };

  return (
    <Paper
      component="section"
      id="gmail-smtp"
      aria-labelledby="gmail-smtp-title"
      variant="outlined"
      sx={{
        p: { xs: 2.25, md: 3 },
        borderRadius: '16px',
        scrollMarginTop: 'calc(var(--layout-header-desktop-height, 80px) + 24px)',
      }}
    >
      <Stack
        component="form"
        spacing={2}
        onSubmit={async (event) => {
          event.preventDefault();
          if (saving || !canSave || !password.trim()) return;
          setSaving(true);
          setMessage(null);
          try {
            const response = await fetch('/api/admin/settings/gmail-smtp/', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            const payload = (await response.json().catch(() => null)) as {
              email?: string;
              error?: string;
            } | null;
            if (!response.ok || !payload?.email)
              throw new Error(payload?.error ?? 'บันทึกบัญชีไม่สำเร็จ');
            setEmail(payload.email);
            setPassword('');
            setShowPassword(false);
            setConfigured(true);
            setMessage({ severity: 'success', text: 'บันทึกบัญชี Gmail SMTP แล้ว' });
          } catch (error) {
            setMessage({
              severity: 'error',
              text: error instanceof Error ? error.message : 'บันทึกบัญชีไม่สำเร็จ',
            });
          } finally {
            setSaving(false);
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: 2,
              bgcolor: 'primary.lighter',
              color: 'primary.dark',
            }}
          >
            <Iconify icon="ri:mail-settings-line" width={24} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography id="gmail-smtp-title" component="h2" variant="h6">
              บัญชีส่งอีเมล Gmail SMTP
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ใช้ส่งอีเมลตอบกลับข้อความติดต่อ
            </Typography>
          </Box>
          <Chip
            size="small"
            color={configured ? 'success' : 'default'}
            label={configured ? 'ตั้งค่าแล้ว' : 'ยังไม่ตั้งค่า'}
          />
        </Stack>
        {!canSave && (
          <Alert severity="warning">
            ต้องตั้งค่าฐานข้อมูลและคีย์เข้ารหัสบนเซิร์ฟเวอร์ก่อนบันทึก
          </Alert>
        )}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <TextField
            label="อีเมลผู้ส่ง"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={saving}
          />
          <TextField
            label="Google App Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={configured ? '***' : undefined}
            slotProps={{
              inputLabel: { shrink: configured ? true : undefined },
              input: {
                readOnly: Boolean(savedPassword),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      edge="end"
                      aria-label={showPassword ? 'ซ่อน App Password' : 'แสดง App Password'}
                      disabled={saving || revealing || (!configured && !password)}
                      onClick={togglePassword}
                    >
                      <Iconify icon={showPassword ? 'ri:eye-off-line' : 'ri:eye-line'} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            required
            value={savedPassword || password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={saving || revealing}
            helperText={
              savedPassword
                ? 'ซ่อนรหัสก่อนกรอก App Password ใหม่'
                : configured
                  ? 'บันทึกรหัสแล้ว กรอก App Password ใหม่เมื่อต้องการเปลี่ยน'
                  : 'กรอก App Password 16 ตัวอักษรเมื่อตั้งค่าหรือเปลี่ยนบัญชี'
            }
          />
        </Box>
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
        <Button
          variant="contained"
          type="submit"
          loading={saving}
          disabled={!canSave || !email.trim() || !password.trim()}
          sx={{ alignSelf: 'flex-start' }}
        >
          บันทึกบัญชี Gmail
        </Button>
      </Stack>
    </Paper>
  );
}
