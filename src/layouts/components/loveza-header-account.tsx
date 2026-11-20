'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { Iconify } from 'src/components/iconify';
import { LovezaSignOutButton } from 'src/components/auth/loveza-sign-out-button';

export type LovezaHeaderUser = {
  displayName: string;
  email: string;
  photoURL: string;
  role: string;
};

type LovezaHeaderAccountProps = {
  user: LovezaHeaderUser;
  mobile?: boolean;
  hideSettingsOnMobile?: boolean;
};

export function LovezaHeaderAccount({
  user,
  mobile = false,
  hideSettingsOnMobile = false,
}: LovezaHeaderAccountProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Button
        href="/account"
        aria-label={`บัญชีของ ${user.displayName}`}
        sx={{
          gap: 1,
          py: 0.625,
          pl: 0.625,
          pr: 1.5,
          minHeight: 44,
          minWidth: 0,
          maxWidth: mobile ? 1 : 210,
          color: 'text.primary',
          borderRadius: '12px',
          justifyContent: 'flex-start',
          textTransform: 'none',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 2px 0 var(--palette-grey-200)',
          '&:hover': {
            bgcolor: 'primary.lighter',
            borderColor: 'primary.light',
            boxShadow: '0 2px 0 var(--palette-grey-200)',
          },
          '&:focus-visible': { outline: '2px solid var(--palette-primary-main)', outlineOffset: 3 },
          '@media (max-width: 899.95px)': {
            width: 44,
            p: 0,
            justifyContent: 'center',
            border: 0,
            bgcolor: 'transparent',
            boxShadow: 'none',
            '&:hover': { bgcolor: 'transparent', boxShadow: 'none' },
          },
        }}
      >
        <Avatar
          src={user.photoURL || undefined}
          alt={user.displayName}
          imgProps={{ referrerPolicy: 'no-referrer' }}
          sx={{
            bgcolor: 'primary.main',
            fontWeight: 800,
            fontSize: 14,
            width: { xs: 36, md: 32 },
            height: { xs: 36, md: 32 },
            boxSizing: 'border-box',
            border: { xs: '2px solid #fff', md: 0 },
          }}
        >
          {user.displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Box
          component="span"
          sx={{
            minWidth: 0,
            textAlign: 'left',
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Typography
            noWrap
            sx={{
              maxWidth: mobile ? 190 : 130,
              fontSize: 13,
              fontWeight: 800,
              color: 'primary.dark',
            }}
          >
            {user.displayName}
          </Typography>
          <Typography
            noWrap
            sx={{
              maxWidth: mobile ? 190 : 130,
              color: 'text.secondary',
              display: mobile ? 'block' : 'none',
              fontSize: 11,
            }}
          >
            {user.email}
          </Typography>
        </Box>
      </Button>
      <IconButton
        onClick={() => setDrawerOpen(true)}
        aria-label="เปิดเมนูเกี่ยวกับและตั้งค่า"
        aria-expanded={drawerOpen}
        aria-controls={drawerOpen ? 'account-settings-drawer' : undefined}
        sx={{
          display: { xs: hideSettingsOnMobile ? 'none' : 'inline-flex', md: 'none' },
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '10px',
          color: 'primary.dark',
          '&:hover': { bgcolor: 'primary.lighter' },
        }}
      >
        <Iconify icon="ri:settings-3-line" width={22} />
      </IconButton>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', md: 400 },
              maxWidth: '100%',
              height: '100dvh',
              borderRadius: 0,
              bgcolor: 'background.default',
              p: 2.5,
              pt: 'max(20px, env(safe-area-inset-top))',
              border: 0,
              pb: 'max(24px, env(safe-area-inset-bottom))',
            },
          },
        }}
      >
        <Box id="account-settings-drawer" role="navigation" aria-label="เกี่ยวกับและตั้งค่า">
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
          >
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: 20 }}>
              เมนูเพิ่มเติม
            </Typography>
            <IconButton aria-label="ปิดเมนู" onClick={() => setDrawerOpen(false)}>
              <Iconify icon="ri:close-line" />
            </IconButton>
          </Box>
          <List
            disablePadding
            sx={{
              '& .MuiListItemButton-root': {
                borderRadius: '12px',
                mb: 1,
                bgcolor: 'background.paper',
                minHeight: 56,
              },
              '& .MuiListItemIcon-root': { minWidth: 36, color: 'primary.dark' },
            }}
          >
            <ListItemButton component="a" href="/about-us/" onClick={() => setDrawerOpen(false)}>
              <ListItemIcon>
                <Iconify icon="ri:information-line" width={22} />
              </ListItemIcon>
              <ListItemText primary="เกี่ยวกับเรา" />
              <Iconify icon="ri:arrow-right-s-line" width={18} />
            </ListItemButton>
            <ListItemButton component="a" href="/account/" onClick={() => setDrawerOpen(false)}>
              <ListItemIcon>
                <Iconify icon="ri:settings-3-line" width={22} />
              </ListItemIcon>
              <ListItemText primary="ตั้งค่าบัญชี" />
              <Iconify icon="ri:arrow-right-s-line" width={18} />
            </ListItemButton>
            <ListItemButton component="a" href="/contact-us/" onClick={() => setDrawerOpen(false)}>
              <ListItemIcon>
                <Iconify icon="ri:mail-line" width={22} />
              </ListItemIcon>
              <ListItemText primary="ติดต่อเรา" />
              <Iconify icon="ri:arrow-right-s-line" width={18} />
            </ListItemButton>
          </List>
          <LovezaSignOutButton
            confirm
            buttonProps={{
              fullWidth: true,
              variant: 'outlined',
              color: 'inherit',
              sx: { mt: 2, minHeight: 44, borderRadius: '12px', borderColor: 'divider' },
            }}
          />
        </Box>
      </Drawer>
    </Box>
  );
}
