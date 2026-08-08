'use client';

import type { Breakpoint } from '@mui/material/styles';
import type { FooterProps } from './footer';
import type { NavMainProps } from './nav/types';
import type { LovezaHeaderUser } from '../components/loveza-header-account';
import type { MainSectionProps, HeaderSectionProps, LayoutSectionProps } from '../core';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { usePathname } from 'src/routes/hooks';

import { Logo } from 'src/components/logo';
import { LovezaSignOutButton } from 'src/components/auth/loveza-sign-out-button';

import { useAuthContext } from 'src/auth/hooks';

import { Footer } from './footer';
import { NavMobile } from './nav/mobile';
import { NavDesktop } from './nav/desktop';
import { getMainNavData } from '../nav-config-main';
import { LovezaBottomNav } from './loveza-bottom-nav';
import { MenuButton } from '../components/menu-button';
import { MainSection, LayoutSection, HeaderSection } from '../core';
import { LovezaHeaderAccount } from '../components/loveza-header-account';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type MainLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  initialUser?: LovezaHeaderUser | null;
  slotProps?: {
    header?: HeaderSectionProps;
    nav?: {
      data?: NavMainProps['data'];
    };
    main?: MainSectionProps;
    footer?: FooterProps;
  };
};

export function MainLayout({
  sx,
  cssVars,
  children,
  slotProps,
  initialUser,
  layoutQuery = 'md',
}: MainLayoutProps) {
  const pathname = usePathname();
  const { user: authUser } = useAuthContext();

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const isHomePage = pathname === '/';

  const contextUser: LovezaHeaderUser | null = authUser
    ? {
        displayName:
          authUser.user_metadata?.full_name ??
          authUser.user_metadata?.name ??
          authUser.email ??
          'Loveza User',
        email: authUser.email ?? '',
        photoURL: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? '',
        role: authUser.app_metadata?.role ?? 'user',
      }
    : null;
  const headerUser = initialUser ?? contextUser;
  const navData = slotProps?.nav?.data ?? getMainNavData(Boolean(headerUser), headerUser?.role);

  const renderHeader = () => {
    const headerSlots: HeaderSectionProps['slots'] = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <>
          {/** @slot Nav mobile */}
          <MenuButton
            onClick={onOpen}
            sx={(theme) => ({
              mr: 1,
              ml: -1,
              [theme.breakpoints.up(layoutQuery)]: { display: 'none' },
            })}
          />
          <NavMobile
            data={navData}
            open={open}
            onClose={onClose}
            slots={{
              bottomArea: headerUser ? (
                <Box sx={{ p: 2.5 }}>
                  <LovezaHeaderAccount user={headerUser} mobile />
                  <Box sx={{ mt: 1 }}>
                    <LovezaSignOutButton
                      buttonProps={{ color: 'inherit', fullWidth: true, variant: 'text' }}
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ p: 2.5 }}>
                  <Button href="/auth/login" variant="contained" fullWidth>
                    เข้าสู่ระบบด้วย Google
                  </Button>
                </Box>
              ),
            }}
          />

          {/** @slot Logo */}
          <Logo />
        </>
      ),
      rightArea: (
        <>
          {/** @slot Nav desktop */}
          <NavDesktop
            data={navData}
            sx={(theme) => ({
              display: 'none',
              [theme.breakpoints.up(layoutQuery)]: {
                mr: 1.5,
                display: 'flex',
                '& ul': { gap: { md: 1.5, lg: 2.5 } },
                ...(isHomePage && { '& button span': { color: '#4B2440' } }),
              },
            })}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            {headerUser ? <LovezaHeaderAccount user={headerUser} /> : null}
            {/** @slot Settings button */}
            {/* <SettingsButton /> */}

            {/** @slot Sign in button */}
            {/* <SignInButton /> */}

            {/** @slot Purchase button */}
            {/* <Button
              variant="contained"
              rel="noopener noreferrer"
              target="_blank"
              href={paths.minimalStore}
              sx={(theme) => ({
                display: 'none',
                [theme.breakpoints.up(layoutQuery)]: { display: 'inline-flex' },
              })}
            >
              Purchase
            </Button> */}
          </Box>
        </>
      ),
    };

    return (
      <HeaderSection
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={slotProps?.header?.slotProps}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderFooter = () =>
    isHomePage ? null : <Footer sx={slotProps?.footer?.sx} layoutQuery={layoutQuery} />;

  const renderMain = () => (
    <MainSection
      {...slotProps?.main}
      sx={[
        { pb: { xs: 'calc(80px + env(safe-area-inset-bottom))', md: 0 } },
        ...(Array.isArray(slotProps?.main?.sx) ? slotProps.main.sx : [slotProps?.main?.sx]),
      ]}
    >
      {children}
    </MainSection>
  );

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={cssVars}
      sx={sx}
    >
      {renderMain()}
      <LovezaBottomNav user={headerUser} />
    </LayoutSection>
  );
}
