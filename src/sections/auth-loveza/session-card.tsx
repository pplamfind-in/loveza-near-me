import type { User } from '@supabase/supabase-js';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { getUserDisplayName } from 'src/lib/user-display-name';

import { LovezaSignOutButton } from 'src/components/auth/loveza-sign-out-button';

import { DisplayNameForm } from 'src/sections/account/display-name-form';

type SessionCardProps = {
  user: User;
  role: 'admin' | 'user';
  compact?: boolean;
};

export function SessionCard({ user, role, compact = false }: SessionCardProps) {
  const displayName = getUserDisplayName(user);
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
        p: { xs: 2.5, md: compact ? 2.5 : 5 },
        border: isAdmin ? 'none' : '5px solid var(--palette-background-paper)',
        borderRadius: '18px',
        bgcolor: 'var(--palette-background-paper)',
        boxShadow: isAdmin
          ? '0 24px 70px rgba(121, 237, 255, 0.12)'
          : '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
      }}
    >
      <Stack
        direction={compact ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={compact ? 'center' : 'flex-start'}
        spacing={2}
      >
        <Stack
          direction={compact ? 'row' : { xs: 'column', sm: 'row' }}
          alignItems={compact ? 'center' : { xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Avatar
            src={avatarUrl}
            alt={String(displayName ?? 'Google profile')}
            imgProps={{ referrerPolicy: 'no-referrer' }}
            sx={{
              width: compact ? 56 : { xs: 64, md: 76 },
              flexShrink: 0,
              height: compact ? 56 : { xs: 64, md: 76 },
              border: isAdmin ? 'none' : '5px solid var(--palette-background-paper)',
              bgcolor: 'var(--palette-primary-main)',
              boxShadow: isAdmin
                ? 'none'
                : '0 4px 0 var(--palette-grey-200), 0 12px 28px rgba(48,63,35,.04)',
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            {avatarLabel}
          </Avatar>
          <Box sx={{ textAlign: 'left', minWidth: 0 }}>
            <Typography
              sx={{ color: 'primary.dark', fontSize: 12, fontWeight: 900, letterSpacing: 2 }}
            >
              {isAdmin ? 'ADMIN DASHBOARD' : compact ? 'บัญชี GOOGLE' : 'LOGIN SUCCESS'}
            </Typography>
            <Typography
              component={compact ? 'h2' : 'h1'}
              sx={{
                mt: 1,
                fontSize: { xs: compact ? 24 : 30, md: compact ? 26 : 42 },
                overflowWrap: 'anywhere',
                fontWeight: 900,
              }}
            >
              {isAdmin ? `สวัสดี ${displayName}` : compact ? displayName : 'เข้าสู่ระบบสำเร็จ 🎉'}
            </Typography>
            {!isAdmin && !compact ? (
              <Typography sx={{ mt: 0.75, fontWeight: 800 }}>{displayName}</Typography>
            ) : null}
            <Typography
              sx={{
                mt: 0.25,
                color: 'text.secondary',
                fontSize: compact ? 13 : 16,
                wordBreak: 'break-word',
              }}
            >
              {user.email}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={isAdmin ? 'ADMIN' : 'พร้อมออกล่า'}
          color={isAdmin ? 'secondary' : 'success'}
          sx={{ borderRadius: '8px' }}
        />
      </Stack>

      {compact && <DisplayNameForm currentName={displayName} />}

      <Typography
        sx={{
          mt: compact ? 2.5 : 4,
          p: 2,
          fontSize: compact ? 13 : 16,
          color: 'text.secondary',
          border: isAdmin ? 'none' : '1px solid var(--palette-grey-300)',
          borderRadius: '16px',
          bgcolor: isAdmin ? '#f4f9f8' : 'var(--palette-secondary-lighter)',
          lineHeight: 1.7,
        }}
      >
        {isAdmin
          ? 'พร้อมตรวจสอบข้อมูลพิกัดร้าน อนุมัติรายงาน และดูแลสถานะสินค้าแล้ว'
          : 'พบ Loveza แล้ว? แจ้งพิกัดและสถานะสินค้า เพื่อช่วยให้เพื่อนนักล่าตามไปเจอ'}
      </Typography>

      <Stack
        direction={compact ? 'column' : { xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mt: compact ? 2.5 : 4 }}
      >
        <LovezaSignOutButton
          confirm={compact && !isAdmin}
          buttonProps={{
            color: 'inherit',
            variant: 'outlined',
            sx: { borderRadius: '12px', minHeight: 42, borderColor: 'divider', boxShadow: 'none' },
          }}
        />
      </Stack>
    </Box>
  );
}
