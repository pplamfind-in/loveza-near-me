'use client';

import type { Breakpoint } from '@mui/material/styles';
import type { FooterProps } from './footer';
import type { NavMainProps } from './nav/types';
import type { LovezaHeaderUser } from '../components/loveza-header-account';
import type { MainSectionProps, HeaderSectionProps, LayoutSectionProps } from '../core';

import { useScrollOffsetTop } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { usePathname } from 'src/routes/hooks';

import { getUserDisplayName } from 'src/lib/user-display-name';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { Footer } from './footer';
import { NavDesktop } from './nav/desktop';
import { getMainNavData } from '../nav-config-main';
import { LovezaBottomNav } from './loveza-bottom-nav';
import { MainSection, LayoutSection, HeaderSection } from '../core';
import { LovezaHeaderAccount } from '../components/loveza-header-account';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type MainLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  initialUser?: LovezaHeaderUser | null;
  brandOwnerAcknowledged?: boolean;
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
  brandOwnerAcknowledged = false,
  layoutQuery = 'md',
}: MainLayoutProps) {
  const pathname = usePathname();
  const { offsetTop: isHeaderOffset } = useScrollOffsetTop();
  const { user: authUser } = useAuthContext();

  const isHomePage = pathname === '/';
  const normalizedPathname = pathname.replace(/\/$/, '');
  const isProductDetailPage = /^\/products\/[^/]+$/.test(normalizedPathname);
  const hideBottomNav = isProductDetailPage || /^\/rewards\/[^/]+$/.test(normalizedPathname);
  const isExplorerLevelsPage = normalizedPathname === '/mapza/leaderboard/levels';
  const hasHeroHeader =
    normalizedPathname === '/mapza/leaderboard' ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/rewards/') ||
    [
      '/',
      '/rewards',
      '/rewards/',
      '/nearby',
      '/nearby/',
      '/mapza',
      '/mapza/',
      '/about-us',
      '/about-us/',
      '/contact-us',
      '/contact-us/',
    ].includes(pathname);

  const contextUser: LovezaHeaderUser | null = authUser
    ? {
        displayName: getUserDisplayName(authUser),
        email: authUser.email ?? '',
        photoURL:
          authUser.user_metadata?.loveza_avatar ||
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          '',
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
          {/** @slot Logo */}
          <Box sx={{ display: 'flex', gap: 1.1, alignItems: 'center' }}>
            <Logo
              isSingle={false}
              sx={{ width: { xs: 112, md: 102 }, height: { xs: 54, md: 50 }, flexShrink: 0 }}
            />
            <Typography
              sx={(theme) => ({
                display: 'none',
                color: 'var(--palette-text-primary)',
                fontSize: 16,
                fontWeight: 1000,
                lineHeight: 1,
                letterSpacing: '-.03em',
                whiteSpace: 'nowrap',
                [theme.breakpoints.up(layoutQuery)]: { display: 'block' },
              })}
            >
              LOVEZA{' '}
              <Box component="span" sx={{ color: 'var(--palette-primary-main)' }}>
                HUNT
              </Box>
            </Typography>
          </Box>
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
                '& ul': { gap: { md: 2, lg: 3.5 } },
                ...(isHomePage && { '& button span': { color: 'var(--palette-primary-dark)' } }),
              },
            })}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            {headerUser ? (
              <LovezaHeaderAccount user={headerUser} avatarOnlyOnMobile={hideBottomNav} />
            ) : (
              <Button
                href="/auth/login"
                aria-label="เข้าสู่ระบบ"
                color="inherit"
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 0.75,
                  minWidth: 0,
                  minHeight: 44,
                  py: 0.5,
                  pl: 0.75,
                  pr: 1.25,
                  color: 'primary.dark',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  boxShadow: '0 2px 0 var(--palette-grey-200)',
                  '&:hover': { bgcolor: 'primary.lighter', borderColor: 'primary.light' },
                  '&:focus-visible': {
                    outline: '2px solid var(--palette-primary-main)',
                    outlineOffset: 3,
                  },
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.5,
                  ...(hideBottomNav && {
                    width: 44,
                    p: 0,
                    justifyContent: 'center',
                    border: 0,
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: 'transparent' },
                  }),
                  [theme.breakpoints.up(layoutQuery)]: { display: 'none' },
                })}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: hideBottomNav ? 36 : 30,
                    height: hideBottomNav ? 36 : 30,
                    borderRadius: hideBottomNav ? '50%' : '9px',
                    border: hideBottomNav ? '2px solid #fff' : 0,
                    bgcolor: 'primary.lighter',
                    flexShrink: 0,
                  }}
                >
                  <Iconify
                    icon={hideBottomNav ? 'ri:user-3-line' : 'ri:login-circle-line'}
                    width={20}
                  />
                </Box>
                {!hideBottomNav && 'เข้าสู่ระบบ'}
              </Button>
            )}
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
        sx={[
          ...(hasHeroHeader
            ? [
                {
                  bgcolor: isHeaderOffset ? 'background.default' : 'transparent',
                  boxShadow: isHeaderOffset ? '0 2px 16px rgba(65,49,30,.06)' : 'none',
                  transition: 'background-color 180ms ease, box-shadow 180ms ease',
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                },
              ]
            : [{ bgcolor: 'background.default' }]),
          ...(isProductDetailPage
            ? [
                {
                  '@media (max-width: 899.95px)': {
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                  },
                },
              ]
            : []),
          ...(Array.isArray(slotProps?.header?.sx) ? slotProps.header.sx : [slotProps?.header?.sx]),
        ]}
      />
    );
  };

  const renderFooter = () =>
    isHomePage || isExplorerLevelsPage ? null : (
      <Footer
        sx={slotProps?.footer?.sx}
        layoutQuery={layoutQuery}
        brandOwnerAcknowledged={brandOwnerAcknowledged}
      />
    );

  const renderMain = () => (
    <MainSection
      {...slotProps?.main}
      sx={[
        {
          pb: { xs: hideBottomNav ? 0 : 'calc(80px + env(safe-area-inset-bottom))', md: 0 },
          bgcolor: 'background.default',
          '& .MuiButton-root': { borderRadius: '12px' },
          '& .MuiButton-containedPrimary': { boxShadow: '0 4px 0 var(--palette-primary-darker)' },
          '& a:focus-visible, & button:focus-visible': {
            outline: '3px solid var(--palette-primary-main)',
            outlineOffset: 3,
          },
          '@media (prefers-reduced-motion: reduce)': {
            '& *, & *::before, & *::after': {
              transition: 'none !important',
              animation: 'none !important',
            },
          },
          ...(isExplorerLevelsPage && { mt: 0, pb: 0 }),
          ...(hasHeroHeader && {
            mt: {
              xs: 'calc(-1 * var(--layout-header-mobile-height))',
              [layoutQuery]: 'calc(-1 * var(--layout-header-desktop-height))',
            },
            px: 0,
            bgcolor: 'background.default',
          }),
        },
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
      headerSection={isExplorerLevelsPage ? null : renderHeader()}
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
      {!hideBottomNav && <LovezaBottomNav user={headerUser} />}
    </LayoutSection>
  );
}
