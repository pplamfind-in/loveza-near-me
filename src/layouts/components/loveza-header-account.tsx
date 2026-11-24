'use client';

import { useId, useState } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
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
  hideSettingsOnMobile?: boolean;
};

export function LovezaHeaderAccount({
  user,
  hideSettingsOnMobile = false,
}: LovezaHeaderAccountProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const popoverId = useId();
  const closeMenus = () => {
    setDrawerOpen(false);
    setAnchor(null);
  };
  const avatar = (
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
        border: '2px solid #fff',
      }}
    >
      {user.displayName.charAt(0).toUpperCase()}
    </Avatar>
  );
  const menuLinks = (
    <>
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
        <ListItemButton component="a" href="/about-us/" onClick={closeMenus}>
          <ListItemIcon>
            <Iconify icon="ri:information-line" width={22} />
          </ListItemIcon>
          <ListItemText primary="เกี่ยวกับเรา" />
          <Iconify icon="ri:arrow-right-s-line" width={18} />
        </ListItemButton>
        <ListItemButton component="a" href="/account/" onClick={closeMenus}>
          <ListItemIcon>
            <Iconify icon="ri:settings-3-line" width={22} />
          </ListItemIcon>
          <ListItemText primary="ตั้งค่าบัญชี" />
          <Iconify icon="ri:arrow-right-s-line" width={18} />
        </ListItemButton>
        <ListItemButton component="a" href="/contact-us/" onClick={closeMenus}>
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
    </>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <IconButton
        aria-label={`บัญชีของ ${user.displayName}`}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? popoverId : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          display: { xs: 'none', md: 'inline-flex' },
          width: 44,
          height: 44,
          '&:hover': { bgcolor: 'primary.lighter' },
        }}
      >
        {avatar}
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={closeMenus}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            id: popoverId,
            role: 'dialog',
            'aria-label': 'เมนูบัญชี',
            sx: { mt: 1, width: 260, p: 1.5, borderRadius: 2 },
          },
        }}
      >
        <Box sx={{ px: 1, pb: 1.5 }} aria-label="บัญชีที่เข้าสู่ระบบ">
          <Typography variant="subtitle2" noWrap>
            {user.displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.email}
          </Typography>
        </Box>
        {menuLinks}
      </Popover>
      <IconButton
        href="/account"
        aria-label={`บัญชีของ ${user.displayName}`}
        sx={{ display: { xs: 'inline-flex', md: 'none' }, width: 44, height: 44, p: 0 }}
      >
        {avatar}
      </IconButton>
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
          {menuLinks}
        </Box>
      </Drawer>
    </Box>
  );
}
