import type { User } from '@supabase/supabase-js';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { LovezaSignOutButton } from 'src/components/auth/loveza-sign-out-button';

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
        border: isAdmin ? 'none' : '3px solid #351129',
        borderRadius: '30px',
        bgcolor: '#fff',
        boxShadow: isAdmin ? '0 24px 70px rgba(121, 237, 255, 0.12)' : '7px 8px 0 #351129',
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
              border: isAdmin ? 'none' : '3px solid #351129',
              bgcolor: '#E5007E',
              boxShadow: isAdmin ? 'none' : '4px 4px 0 #351129',
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
          border: isAdmin ? 'none' : '2px solid #351129',
          borderRadius: '16px',
          bgcolor: isAdmin ? '#f4f9f8' : '#FFF0B8',
          lineHeight: 1.7,
        }}
      >
        {isAdmin
          ? 'พร้อมตรวจสอบข้อมูลพิกัดร้าน อนุมัติรายงาน และดูแลสถานะสินค้าแล้ว'
          : 'พร้อมช่วยบอกต่อแล้ว! หากพบ Loveza สามารถแจ้งพิกัดร้าน รสชาติ และจำนวนที่เหลือให้คนอื่นตามไปซื้อได้เลย'}
      </Typography>

      <Stack
        direction={compact ? 'column' : { xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mt: 4 }}
      >
        <LovezaSignOutButton
          confirm={compact && !isAdmin}
          buttonProps={{ color: 'inherit', sx: { borderRadius: 99 } }}
        />
      </Stack>
    </Box>
  );
}
