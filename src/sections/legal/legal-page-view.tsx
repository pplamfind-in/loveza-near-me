'use client';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { explorerLabelSx } from 'src/sections/home/explorer-styles';

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

const pages = [
  { title: 'ข้อกำหนดการใช้งาน', href: '/terms/', icon: 'ri:file-text-line' },
  { title: 'นโยบายความเป็นส่วนตัว', href: '/privacy/', icon: 'ri:shield-user-line' },
  { title: 'นโยบายคุกกี้', href: '/cookies/', icon: 'ri:settings-3-line' },
  { title: 'แนวทางชุมชน', href: '/community-guidelines/', icon: 'ri:community-line' },
];

export function LegalPageView({ eyebrow, title, intro, sections }: LegalPageViewProps) {
  const currentPage = pages.find((page) => page.title === title);
  const cardSx = {
    border: '5px solid var(--palette-background-paper)',
    borderRadius: '18px',
    bgcolor: 'background.paper',
    boxShadow: '0 4px 0 var(--palette-grey-200)',
  };
  const contents = sections.map((section, index) => (
    <Link
      key={section.title}
      href={`#legal-section-${index + 1}`}
      underline="none"
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 1,
        py: 1,
        color: 'text.secondary',
        fontSize: 12,
        lineHeight: 1.75,
        borderRadius: '6px',
        '&:hover': { color: 'primary.main' },
        '&:focus-visible': { outline: '2px solid var(--palette-primary-main)', outlineOffset: 2 },
      }}
    >
      <Box
        component="span"
        sx={{ color: 'primary.main', fontSize: 10, fontWeight: 800, flexShrink: 0 }}
      >
        {String(index + 1).padStart(2, '0')}
      </Box>
      {section.title}
    </Link>
  ));
  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 12, md: 13 }, pb: 6, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Stack
          component="nav"
          aria-label="หน้าข้อมูลและนโยบาย"
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ mb: 2.5 }}
        >
          {pages.map((page) => (
            <Button
              key={page.href}
              href={page.href}
              aria-current={page.title === title ? 'page' : undefined}
              startIcon={<Iconify icon={page.icon} width={17} />}
              sx={{
                px: 1.5,
                minHeight: 40,
                fontSize: 12,
                bgcolor: page.title === title ? 'primary.main' : 'background.paper',
                color: page.title === title ? 'common.white' : 'text.secondary',
                '&:hover': { bgcolor: page.title === title ? 'primary.dark' : 'primary.lighter' },
              }}
            >
              {page.title}
            </Button>
          ))}
        </Stack>
        <Box component="header" sx={{ ...cardSx, position: 'relative', overflow: 'hidden', mb: 3 }}>
          <Box
            aria-hidden="true"
            component="img"
            src="/assets/loveza/login-welcome-v1.webp"
            alt=""
            width={1536}
            height={1024}
            sx={{
              position: 'absolute',
              inset: 0,
              width: 1,
              height: 1,
              objectFit: 'cover',
              objectPosition: 'right 45%',
              opacity: 0.22,
            }}
          />
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, var(--palette-background-paper) 10%, rgba(255,253,250,.96) 50%, rgba(255,253,250,.3) 100%)',
            }}
          />
          <Box sx={{ position: 'relative', p: { xs: 2.5, md: 4 }, maxWidth: 820 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'primary.main' }}>
              <Iconify icon={currentPage?.icon ?? 'ri:file-text-line'} width={20} />
              <Typography sx={explorerLabelSx}>{eyebrow}</Typography>
            </Stack>
            <Typography
              component="h1"
              sx={{
                mt: 1.5,
                fontSize: { xs: 30, sm: 38, md: 44 },
                lineHeight: 1.4,
                fontWeight: 900,
                letterSpacing: '-.02em',
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                mt: 1.5,
                maxWidth: 680,
                fontSize: { xs: 14, md: 15 },
                lineHeight: 1.9,
                color: 'text.secondary',
              }}
            >
              {intro}
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{ mt: 2, color: 'text.secondary' }}
            >
              <Iconify icon="ri:time-line" width={14} />
              <Typography sx={{ fontSize: 11 }}>ปรับปรุงล่าสุด: 11 สิงหาคม 2569</Typography>
            </Stack>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '230px minmax(0, 1fr)' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Box
            component="aside"
            sx={{
              ...cardSx,
              p: 2,
              position: { md: 'sticky' },
              top: { md: 96 },
              maxHeight: { md: 'calc(100dvh - 120px)' },
              overflowY: { md: 'auto' },
            }}
          >
            <Box component="nav" aria-label="สารบัญ" sx={{ display: { xs: 'none', md: 'block' } }}>
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ mb: 1, color: 'primary.dark' }}
              >
                <Iconify icon="ri:list-check" width={18} />
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>เนื้อหาในหน้านี้</Typography>
              </Stack>
              {contents}
            </Box>
            <Box
              component="details"
              sx={{
                display: { md: 'none' },
                '& summary': {
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'primary.dark',
                  cursor: 'pointer',
                  py: 0.5,
                },
              }}
            >
              <Box component="summary">เนื้อหาในหน้านี้ · {sections.length} หัวข้อ</Box>
              <Box component="nav" aria-label="สารบัญบนมือถือ" sx={{ mt: 1 }}>
                {contents}
              </Box>
            </Box>
          </Box>
          <Stack spacing={2.5} sx={{ minWidth: 0 }}>
            {sections.map((section, index) => (
              <Box
                component="section"
                id={`legal-section-${index + 1}`}
                aria-labelledby={`legal-heading-${index + 1}`}
                key={section.title}
                sx={{ ...cardSx, p: { xs: 2, sm: 3 }, scrollMarginTop: 96 }}
              >
                <Stack direction="row" spacing={1.25} alignItems="baseline">
                  <Typography
                    component="span"
                    sx={{ color: 'primary.main', fontSize: 12, fontWeight: 800, flexShrink: 0 }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </Typography>
                  <Typography
                    component="h2"
                    id={`legal-heading-${index + 1}`}
                    sx={{ fontSize: { xs: 19, md: 22 }, lineHeight: 1.6, fontWeight: 800 }}
                  >
                    {section.title}
                  </Typography>
                </Stack>
                {section.paragraphs?.map((paragraph) => (
                  <Typography
                    key={paragraph}
                    sx={{
                      mt: 1.5,
                      fontSize: 14,
                      color: 'text.secondary',
                      lineHeight: 2,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {paragraph}
                  </Typography>
                ))}
                {section.items ? (
                  <Box
                    component="ul"
                    sx={{
                      mt: 1.5,
                      mb: 0,
                      pl: 2.5,
                      color: 'text.secondary',
                      '& li::marker': { color: 'primary.main' },
                    }}
                  >
                    {section.items.map((item) => (
                      <Typography
                        component="li"
                        key={item}
                        sx={{
                          mb: 1,
                          pl: 0.5,
                          fontSize: 14,
                          lineHeight: 1.9,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Box>
                ) : null}
              </Box>
            ))}
            <Box
              component="section"
              sx={{ p: 2.5, borderRadius: '14px', bgcolor: 'primary.lighter' }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Iconify
                  icon="ri:customer-service-2-line"
                  width={22}
                  sx={{ color: 'primary.main', flexShrink: 0, mt: 0.3 }}
                />
                <Typography sx={{ color: 'text.primary', fontSize: 13, lineHeight: 1.9 }}>
                  ต้องการสอบถาม ใช้สิทธิ์เกี่ยวกับข้อมูลส่วนบุคคล หรือขอแก้ไข/ลบข้อมูล?{' '}
                  <Link href="/contact-us/#contact-form" fontWeight={800}>
                    ส่งคำขอผ่านแบบฟอร์มติดต่อ
                  </Link>
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
