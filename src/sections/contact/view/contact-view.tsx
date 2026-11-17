'use client';

import type { ContactMessageInput, ContactMessageFormValues } from 'src/app/contact-us/schema';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { contactMessageSchema } from 'src/app/contact-us/schema';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { explorerLabelSx } from 'src/sections/home/explorer-styles';

const defaultValues: ContactMessageFormValues = {
  name: '',
  email: '',
  subject: '',
  message: '',
  website: '',
};

export function ContactView() {
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const methods = useForm<ContactMessageFormValues, unknown, ContactMessageInput>({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: zodResolver(contactMessageSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const response = await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) throw new Error(payload.error ?? 'ส่งข้อความไม่สำเร็จ');

      setSubmitSuccess(payload.message ?? 'ส่งข้อความเรียบร้อยแล้ว');
      reset(defaultValues);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'ส่งข้อความไม่สำเร็จ');
    }
  });

  return (
    <Box sx={{ minHeight: '100vh', pb: 6, bgcolor: 'background.default' }}>
      <Box
        component="section"
        sx={{ position: 'relative', overflow: 'hidden', minHeight: { md: 500 } }}
      >
        <Box
          component="img"
          src="/assets/loveza/login-welcome-v1.webp"
          alt=""
          width={1536}
          height={1024}
          fetchPriority="high"
          sx={{
            position: 'absolute',
            inset: 0,
            width: 1,
            height: 1,
            objectFit: 'cover',
            objectPosition: 'right 50%',
            maskImage: 'linear-gradient(to bottom, black 75%, transparent)',
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            background: {
              xs: 'linear-gradient(180deg, var(--palette-background-default), rgba(251,246,237,.96) 50%, transparent)',
              md: 'linear-gradient(90deg, var(--palette-background-default), rgba(251,246,237,.94) 35%, transparent 85%)',
            },
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box
            sx={{
              maxWidth: 540,
              pt: {
                xs: 'calc(var(--layout-header-mobile-height) + 32px)',
                md: 'calc(var(--layout-header-desktop-height) + 56px)',
              },
              pb: { xs: 22, md: 10 },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'primary.main' }}>
              <Iconify icon="ri:mail-send-line" width={20} />
              <Typography sx={explorerLabelSx}>A MESSAGE ALONG THE WAY</Typography>
            </Stack>
            <Typography
              component="h1"
              sx={{
                mt: 2,
                fontSize: { xs: 38, md: 52 },
                lineHeight: 1.35,
                fontWeight: 900,
                letterSpacing: '-.03em',
              }}
            >
              มีเรื่องอยากบอก
              <br />
              <Box component="span" sx={{ color: 'primary.main' }}>
                เราพร้อมรับฟัง
              </Box>
            </Typography>
            <Typography
              sx={{ mt: 2, maxWidth: 420, fontSize: 15, color: 'text.secondary', lineHeight: 1.9 }}
            >
              แจ้งปัญหา เสนอไอเดีย หรือขอแก้ไขข้อมูล
              <br />
              ทุกข้อความช่วยให้ Loveza Hunt ดีขึ้นสำหรับทุกคน
            </Typography>
            <Button
              href="#contact-form"
              variant="contained"
              endIcon={<Iconify icon="ri:arrow-down-line" />}
              sx={{ mt: 3, px: 3, minHeight: 44 }}
            >
              ฝากข้อความถึงเรา
            </Button>
          </Box>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ position: 'relative', mt: { xs: -3, md: -2 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '.7fr 1.3fr' },
            gap: { xs: 3, md: 4 },
            alignItems: 'start',
          }}
        >
          <Stack component="section" spacing={2}>
            <Box sx={{ px: 0.5 }}>
              <Typography sx={explorerLabelSx}>LET’S MAKE IT BETTER</Typography>
              <Typography component="h2" sx={{ mt: 1, fontSize: 25, fontWeight: 800 }}>
                คุยกับเราเรื่องไหนดี?
              </Typography>
            </Box>
            {[
              {
                icon: 'ri:map-pin-2-line',
                title: 'พิกัดหรือข้อมูลไม่ตรง',
                body: 'บอกชื่อร้าน จังหวัด และข้อมูลที่อยากให้ตรวจสอบ',
              },
              {
                icon: 'ri:lightbulb-line',
                title: 'ปัญหาการใช้งานและไอเดีย',
                body: 'เล่าสิ่งที่พบ หรือสิ่งที่อยากให้ Loveza Hunt มีเพิ่ม',
              },
              {
                icon: 'ri:shield-user-line',
                title: 'ข้อมูลส่วนตัวและสิทธิในเนื้อหา',
                body: 'ติดต่อขอแก้ไข ลบข้อมูล หรือแจ้งเรื่องสิทธิในเนื้อหา',
              },
            ].map((item) => (
              <Stack
                key={item.title}
                direction="row"
                spacing={1.5}
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  border: '5px solid var(--palette-background-paper)',
                  borderRadius: '18px',
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    alignSelf: 'flex-start',
                    display: 'flex',
                    flexShrink: 0,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                    borderRadius: '10px',
                  }}
                >
                  <Iconify icon={item.icon} width={22} />
                </Box>
                <Box>
                  <Typography
                    component="h3"
                    sx={{ fontSize: 15, fontWeight: 800, lineHeight: 1.7 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary', lineHeight: 1.8 }}
                  >
                    {item.body}
                  </Typography>
                </Box>
              </Stack>
            ))}
            <Box sx={{ p: 2.5, bgcolor: 'primary.lighter', borderRadius: '14px' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                เจอร้านใหม่ อยากบอกต่อ?
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: 12, color: 'text.secondary', lineHeight: 1.8 }}>
                เพิ่มพิกัดลงแผนที่ได้จากหน้าแจ้งพิกัดโดยตรง
              </Typography>
              <Button
                href="/report"
                size="small"
                endIcon={<Iconify icon="ri:arrow-right-line" width={16} />}
                sx={{ mt: 1, px: 0 }}
              >
                ไปแจ้งพิกัดร้าน
              </Button>
            </Box>
          </Stack>
          <Box
            component="section"
            id="contact-form"
            sx={{
              scrollMarginTop: 96,
              p: { xs: 2, sm: 3 },
              position: 'relative',
              border: '5px solid var(--palette-background-paper)',
              borderRadius: '18px',
              bgcolor: 'background.paper',
              boxShadow: '0 4px 0 var(--palette-grey-200)',
              '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'background.default' },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                component="img"
                src="/assets/icons/loveza/voxel-store.svg"
                alt=""
                width={44}
                height={44}
              />
              <Box>
                <Typography component="h2" sx={{ fontSize: { xs: 22, md: 25 }, fontWeight: 800 }}>
                  ส่งข้อความถึงทีมดูแล
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>
                  กรอกอีเมลที่ติดต่อกลับได้ พร้อมรายละเอียดเรื่องที่แจ้ง
                </Typography>
              </Box>
            </Stack>
            <Form methods={methods} onSubmit={onSubmit}>
              <Stack spacing={2.25} sx={{ mt: 2.5 }}>
                {submitSuccess ? (
                  <Alert severity="success" role="status">
                    {submitSuccess}
                  </Alert>
                ) : null}
                {submitError ? <Alert severity="error">{submitError}</Alert> : null}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Field.Text
                    required
                    name="name"
                    label="ชื่อของคุณ"
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                  />
                  <Field.Text
                    required
                    name="email"
                    type="email"
                    label="อีเมล"
                    slotProps={{ htmlInput: { maxLength: 254 } }}
                  />
                </Box>
                <Field.Text
                  required
                  name="subject"
                  label="หัวข้อ"
                  slotProps={{ htmlInput: { maxLength: 150 } }}
                />
                <Field.Text
                  required
                  multiline
                  rows={5}
                  name="message"
                  label="เล่าให้เราฟังได้เลย"
                  slotProps={{ htmlInput: { maxLength: 5000 } }}
                />
                <Box
                  aria-hidden="true"
                  sx={{
                    top: 0,
                    left: 0,
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    clip: 'rect(0 0 0 0)',
                  }}
                >
                  <Field.Text
                    name="website"
                    label="เว็บไซต์"
                    slotProps={{ htmlInput: { tabIndex: -1 } }}
                  />
                </Box>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="large"
                  variant="contained"
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Iconify icon="ri:send-plane-fill" />
                    )
                  }
                  sx={{
                    minHeight: 48,
                    borderRadius: '12px',
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อความถึงทีมดูแล'}
                </Button>
                <Typography sx={{ color: 'text.secondary', fontSize: 11, lineHeight: 1.8 }}>
                  ข้อมูลนี้ใช้เพื่อตรวจสอบและตอบกลับเรื่องที่คุณแจ้ง{' '}
                  <Link href="/privacy" underline="hover">
                    อ่านนโยบายความเป็นส่วนตัว
                  </Link>
                </Typography>
              </Stack>
            </Form>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
