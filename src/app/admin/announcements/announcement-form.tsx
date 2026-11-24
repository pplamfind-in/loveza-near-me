'use client';

import type { AnnouncementValues } from './schema';

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FormControlLabel from '@mui/material/FormControlLabel';

import { DashboardContent } from 'src/layouts/dashboard';
import { ANNOUNCEMENT_COVER_TYPES } from 'src/lib/announcements';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { saveAnnouncement } from './actions';
import { publicationModes, announcementSchema } from './schema';

const publicationOptions = {
  immediate: 'เผยแพร่ทันที',
  scheduled: 'ตั้งวันเริ่ม',
  draft: 'บันทึกแบบร่าง',
} as const;

function CalendarIcon() {
  return <Iconify icon="ri:calendar-event-line" width={22} />;
}

function PreviousMonthIcon() {
  return <Iconify icon="ri:arrow-left-s-line" width={22} />;
}

function NextMonthIcon() {
  return <Iconify icon="ri:arrow-right-s-line" width={22} />;
}

function SwitchCalendarViewIcon() {
  return <Iconify icon="ri:arrow-down-s-line" width={22} />;
}

export function AnnouncementForm({
  id,
  values,
  coverUrl,
}: {
  id?: string;
  values: Pick<AnnouncementValues, 'title' | 'content' | 'publicationMode' | 'publishDate'>;
  coverUrl?: string;
}) {
  const methods = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { ...values, cover: null, removeCover: false },
  });
  const publicationMode = useWatch({ control: methods.control, name: 'publicationMode' });
  const removingCover = useWatch({ control: methods.control, name: 'removeCover' });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const displayedCover = previewUrl ?? (removingCover ? null : coverUrl);
  const { errors, isSubmitting } = methods.formState;
  const submit = methods.handleSubmit(
    async ({ title, content, publicationMode: mode, publishDate, cover, removeCover }) => {
      const form = new FormData();
      form.set('title', title);
      form.set('content', content);
      form.set('publicationMode', mode);
      form.set('publishDate', publishDate);
      form.set('removeCover', String(removeCover));
      if (cover) form.set('cover', cover);
      const error = await saveAnnouncement(id ?? null, form);
      if (error) methods.setError('root', { message: error });
    }
  );

  return (
    <DashboardContent maxWidth={false}>
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Button
          href="/admin/announcements/"
          color="inherit"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{ alignSelf: 'flex-start' }}
        >
          กลับไปหน้าประกาศ
        </Button>
        <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
          {id ? 'แก้ไขประกาศ' : 'สร้างประกาศ'}
        </Typography>
        <Form methods={methods} onSubmit={submit}>
          <Stack spacing={2.5}>
            <Card variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2.5}>
                <Field.Text name="title" label="หัวข้อประกาศ" required />
                <Stack spacing={1}>
                  <Typography variant="subtitle2">ภาพปก</Typography>
                  {displayedCover && (
                    <Box
                      component="img"
                      src={displayedCover}
                      alt={previewUrl ? 'ตัวอย่างภาพปกที่เลือก' : 'ภาพปกปัจจุบัน'}
                      sx={{
                        maxHeight: 160,
                        maxWidth: '100%',
                        alignSelf: 'flex-start',
                        borderRadius: 1,
                      }}
                    />
                  )}
                  <Controller
                    control={methods.control}
                    name="cover"
                    render={({ field }) => (
                      <Stack spacing={0.75} alignItems="flex-start">
                        <Button component="label" variant="outlined" disabled={isSubmitting}>
                          {coverUrl ? 'เปลี่ยนภาพปก' : 'เลือกรูปภาพ'}
                          <Box
                            component="input"
                            type="file"
                            accept={ANNOUNCEMENT_COVER_TYPES.join(',')}
                            sx={{
                              position: 'absolute',
                              width: 1,
                              height: 1,
                              clipPath: 'inset(50%)',
                            }}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                field.onChange(file);
                                setPreviewUrl(
                                  announcementSchema.shape.cover.safeParse(file).success
                                    ? URL.createObjectURL(file)
                                    : null
                                );
                                methods.setValue('removeCover', false);
                              }
                              event.target.value = '';
                            }}
                          />
                        </Button>
                        <Typography
                          variant="caption"
                          color={errors.cover ? 'error' : 'text.secondary'}
                        >
                          {errors.cover?.message ??
                            field.value?.name ??
                            'JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB'}
                        </Typography>
                        {field.value && (
                          <Button
                            size="small"
                            onClick={() => {
                              field.onChange(null);
                              setPreviewUrl(null);
                            }}
                          >
                            ยกเลิกไฟล์ที่เลือก
                          </Button>
                        )}
                      </Stack>
                    )}
                  />
                  {coverUrl && (
                    <Controller
                      control={methods.control}
                      name="removeCover"
                      render={({ field }) => (
                        <FormControlLabel
                          label="นำภาพปกเดิมออก"
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(_, checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  methods.setValue('cover', null);
                                  setPreviewUrl(null);
                                }
                              }}
                            />
                          }
                        />
                      )}
                    />
                  )}
                </Stack>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">รายละเอียดประกาศ</Typography>
                  <Field.Editor name="content" placeholder="เขียนรายละเอียดประกาศ" />
                </Stack>
              </Stack>
            </Card>
            <Card
              component="section"
              aria-labelledby="announcement-publication"
              variant="outlined"
              sx={{ p: { xs: 2, sm: 3 } }}
            >
              <Typography id="announcement-publication" component="h2" variant="h6">
                การเผยแพร่ประกาศ
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                วันที่และเวลาอ้างอิงเวลาไทย (UTC+7)
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Field.Text select name="publicationMode" label="เผยแพร่">
                  {publicationModes.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {publicationOptions[mode]}
                    </MenuItem>
                  ))}
                </Field.Text>
                {publicationMode === 'scheduled' && (
                  <Controller
                    control={methods.control}
                    name="publishDate"
                    render={({ field, fieldState }) => (
                      <DatePicker
                        label="วันเริ่มเผยแพร่"
                        slots={{
                          openPickerIcon: CalendarIcon,
                          leftArrowIcon: PreviousMonthIcon,
                          rightArrowIcon: NextMonthIcon,
                          switchViewIcon: SwitchCalendarViewIcon,
                        }}
                        format="DD/MM/YYYY"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) =>
                          field.onChange(date?.isValid() ? date.format('YYYY-MM-DD') : '')
                        }
                        inputRef={field.ref}
                        slotProps={{
                          textField: {
                            required: true,
                            fullWidth: true,
                            error: Boolean(fieldState.error),
                            helperText:
                              fieldState.error?.message ?? 'เผยแพร่ตั้งแต่ 00:00 น. ตามเวลาไทย',
                            onBlur: field.onBlur,
                          },
                        }}
                      />
                    )}
                  />
                )}
              </Box>
            </Card>
            {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}
            <Stack direction="row" gap={1} justifyContent="flex-end">
              <Button href="/admin/announcements">ยกเลิก</Button>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {publicationMode === 'draft' ? 'บันทึกแบบร่าง' : 'บันทึกประกาศ'}
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Stack>
    </DashboardContent>
  );
}
