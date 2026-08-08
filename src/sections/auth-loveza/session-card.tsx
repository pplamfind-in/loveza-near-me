import type { User } from '@supabase/supabase-js';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { signOutAction } from 'src/app/auth/actions';

type SessionCardProps = {
  user: User;
  role: 'admin' | 'user';
  compact?: boolean;
};

export function SessionCard({ user, role, compact = false }: SessionCardProps) {
  const displayName = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email;
  const avatarUrl = user.user_metadata.avatar_url ?? user.user_metadata.picture;
  const avatarLabel = String(displayName ?? user.email ?? 'L')
    .charAt(0)
    .toUpperCase();
  const isAdmin = role === 'admin';

  return (
    <Box
      sx={{
        width: 1,
        maxWidth: compact ? 'none' : 680,
        mx: compact ? 0 : 'auto',
        p: { xs: 3, md: compact ? 3.5 : 5 },
        borderRadius: '30px',
        bgcolor: '#fff',
        boxShadow: '0 24px 70px rgba(52,78,82,.12)',
      }}
    >
      <Stack
        direction={compact ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={compact ? 'center' : 'flex-start'}
        spacing={2}
      >
        <Stack
          direction={compact ? 'column' : { xs: 'column', sm: 'row' }}
          alignItems={compact ? 'center' : { xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Avatar
            src={avatarUrl}
            alt={String(displayName ?? 'Google profile')}
            imgProps={{ referrerPolicy: 'no-referrer' }}
            sx={{
              width: { xs: 64, md: 76 },
              height: { xs: 64, md: 76 },
              bgcolor: '#ef2382',
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            {avatarLabel}
          </Avatar>
          <Box sx={{ textAlign: compact ? 'center' : 'left' }}>
            <Typography sx={{ color: '#00a99d', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
              {isAdmin ? 'ADMIN DASHBOARD' : compact ? 'บัญชี GOOGLE' : 'LOGIN SUCCESS'}
            </Typography>
            <Typography
              component={compact ? 'h2' : 'h1'}
              sx={{ mt: 1, fontSize: { xs: 30, md: compact ? 32 : 42 }, fontWeight: 900 }}
            >
              {isAdmin ? `สวัสดี ${displayName}` : compact ? displayName : 'เข้าสู่ระบบสำเร็จ 🎉'}
            </Typography>
            {!isAdmin && !compact ? (
              <Typography sx={{ mt: 0.75, fontWeight: 800 }}>{displayName}</Typography>
            ) : null}
            <Typography sx={{ mt: 0.25, color: '#77807e', wordBreak: 'break-word' }}>
              {user.email}
            </Typography>
          </Box>
        </Stack>
        <Chip label={isAdmin ? 'ADMIN' : 'พร้อมใช้งาน'} color={isAdmin ? 'secondary' : 'success'} />
      </Stack>

      <Typography
        sx={{
          mt: 4,
          p: 2,
          color: '#5c6865',
          borderRadius: '16px',
          bgcolor: '#f4f9f8',
          lineHeight: 1.7,
        }}
      >
        {isAdmin
          ? 'พร้อมตรวจสอบข้อมูลพิกัดร้าน อนุมัติรายงาน และดูแลสถานะสินค้าแล้ว'
          : 'พร้อมช่วยบอกต่อแล้ว! หากพบ Loveza สามารถแจ้งพิกัดร้าน รสชาติ และจำนวนที่เหลือให้คนอื่นตามไปซื้อได้เลย'}
      </Typography>

      <Stack
        component="form"
        action={signOutAction}
        direction={compact ? 'column' : { xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mt: 4 }}
      >
        <Button
          href={isAdmin ? '#pending-reports' : '/report'}
          variant="contained"
          sx={{ borderRadius: 99, bgcolor: '#ef2382', '&:hover': { bgcolor: '#d91873' } }}
        >
          {isAdmin ? 'ดูข้อมูลรอตรวจสอบ' : 'แจ้งพิกัด Loveza ตอนนี้'}
        </Button>
        <Button type="submit" color="inherit" sx={{ borderRadius: 99 }}>
          ออกจากระบบ
        </Button>
      </Stack>
    </Box>
  );
}
