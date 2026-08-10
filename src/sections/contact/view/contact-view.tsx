'use client';

import type {
  ContactMessageInput,
  ContactMessageFormValues,
} from 'src/app/contact-us/schema';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { contactMessageSchema } from 'src/app/contact-us/schema';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

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
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: 5, md: 8 },
        background:
          'radial-gradient(circle at 12px 12px, rgba(124,58,237,.1) 2px, transparent 2.5px) 0 0 / 28px 28px, #FFF1F8',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            p: { xs: 3.5, md: 6 },
            color: '#fff',
            border: '3px solid #351129',
            borderRadius: { xs: '28px', md: '40px' },
            background: 'linear-gradient(135deg, #6D28D9, #E5007E)',
            boxShadow: '9px 10px 0 #351129',
          }}
        >
          <Typography sx={{ color: '#FDE047', fontSize: 12, fontWeight: 1000, letterSpacing: 2 }}>
            LET&apos;S TALK!
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 1.5,
              maxWidth: 760,
              fontSize: { xs: 48, md: 76 },
              lineHeight: 0.95,
              fontWeight: 1000,
              letterSpacing: '-.07em',
            }}
          >
            มีอะไรอยากบอกเราไหม?
          </Typography>
          <Typography
            sx={{ mt: 2.5, maxWidth: 650, color: '#FFF0F8', fontSize: { xs: 16, md: 18 } }}
          >
            แจ้งปัญหา ขอแก้ไขหรือลบข้อมูล เสนอไอเดีย หรือแจ้งเรื่องสิทธิในเนื้อหาได้ที่นี่
          </Typography>
          <Button
            component="a"
            href="#contact-form"
            variant="contained"
            startIcon={<Iconify icon="ri:send-plane-fill" />}
            sx={{
              mt: 3,
              color: '#351129',
              bgcolor: '#FDE047',
              border: '2px solid #351129',
              boxShadow: '4px 5px 0 #351129',
              '&:hover': { bgcolor: '#FFE96B' },
            }}
          >
            ส่งข้อความผ่านแบบฟอร์ม
          </Button>
        </Box>

        <Box
          component="section"
          sx={{
            mt: 4,
            display: 'grid',
            gap: 3,
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', md: '.75fr 1.25fr' },
          }}
        >
          <Stack spacing={2}>
            {[
              {
                icon: 'ri:map-pin-2-fill',
                title: 'พิกัดร้านไม่ตรง?',
                body: 'แจ้งรายละเอียดจุดขายที่ควรแก้ไขให้ทีมตรวจสอบ',
                color: '#70E1F5',
              },
              {
                icon: 'ri:lightbulb-flash-fill',
                title: 'มีไอเดียเริ่ด ๆ?',
                body: 'เสนอ Feature ที่อยากเห็นใน Loveza Hunt',
                color: '#FDE047',
              },
              {
                icon: 'ri:heart-3-fill',
                title: 'อยากช่วย Community?',
                body: 'ออกตามหาแล้วแจ้งพิกัดใหม่ได้ทันที',
                color: '#FFB7D9',
              },
            ].map((item) => (
              <Box
                key={item.title}
                sx={{
                  p: 3,
                  border: '3px solid #351129',
                  borderRadius: '24px',
                  bgcolor: item.color,
                  boxShadow: '5px 6px 0 #351129',
                }}
              >
                <Iconify icon={item.icon} width={28} />
                <Typography sx={{ mt: 2, fontSize: 21, fontWeight: 1000 }}>{item.title}</Typography>
                <Typography sx={{ mt: 0.5, color: '#5B3A50' }}>{item.body}</Typography>
              </Box>
            ))}
          </Stack>

          <Box
            id="contact-form"
            sx={{
              scrollMarginTop: 120,
              p: { xs: 3, md: 4.5 },
              border: '3px solid #351129',
              borderRadius: '30px',
              bgcolor: '#fff',
              boxShadow: '7px 8px 0 #351129',
            }}
          >
            <Typography component="h2" sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 1000 }}>
              ส่งข้อความถึงทีม Loveza Hunt
            </Typography>
            <Form methods={methods} onSubmit={onSubmit}>
              <Stack spacing={2.25} sx={{ mt: 3 }}>
                {submitSuccess ? <Alert severity="success">{submitSuccess}</Alert> : null}
                {submitError ? <Alert severity="error">{submitError}</Alert> : null}
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
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
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
                    color: '#351129',
                    border: '2px solid #351129',
                    backgroundImage: 'none',
                    bgcolor: '#FDE047',
                    boxShadow: '4px 5px 0 #351129',
                  }}
                >
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อความถึง Admin'}
                </Button>
              </Stack>
            </Form>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
