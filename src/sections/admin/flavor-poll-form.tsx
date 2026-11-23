'use client';

import type { FlavorPollFormValues } from 'src/app/admin/flavor-polls/schema';

import dayjs from 'dayjs';
import Link from 'next/link';
import { useState } from 'react';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { unstable_rethrow } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, Controller, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { paths } from 'src/routes/paths';

import { activityTheme } from 'src/lib/activity-theme';
import { DashboardContent } from 'src/layouts/dashboard';
import { saveFlavorPoll } from 'src/app/admin/flavor-polls/actions';
import { flavorPollSchema } from 'src/app/admin/flavor-polls/schema';
import { flavorPollPublicationLabel } from 'src/lib/flavor-poll-schedule';
import {
  getFlavorPollOptionDetails,
  MAX_FLAVOR_POLL_IMAGE_BYTES,
} from 'src/lib/flavor-poll-options';

import { Editor } from 'src/components/editor';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

dayjs.extend(utc);
dayjs.extend(timezone);

type FlavorPollFormProps = {
  poll?: {
    id: string;
    activity_type: FlavorPollFormValues['activityType'];
    title: string;
    slug: string | null;
    description_html: string;
    options: string[];
    option_details: unknown;
    starts_at: string | null;
    ends_at: string | null;
    source_url: string | null;
    theme_color: string | null;
    theme_text_color: string | null;
    background_image_url: string | null;
    is_active: boolean;
    status: keyof typeof flavorPollPublicationLabel;
  };
  optionsLocked?: boolean;
  votesError?: boolean;
  cardProducts?: { id: string; label: string; description: string; imageUrl: string }[];
  cardProductsError?: boolean;
};

const listHref = '/admin/flavor-polls/';

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

export function FlavorPollForm({
  poll,
  optionsLocked,
  votesError,
  cardProducts = [],
  cardProductsError,
}: FlavorPollFormProps) {
  const theme = useTheme();
  const methods = useForm<FlavorPollFormValues>({
    resolver: zodResolver(flavorPollSchema),
    mode: 'onTouched',
    defaultValues: {
      activityType: poll?.activity_type ?? 'poll',
      title: poll?.title ?? '',
      slug: poll?.slug ?? '',
      descriptionHtml: poll?.description_html ?? '',
      publication:
        poll?.status === 'draft'
          ? 'draft'
          : poll && !poll.is_active
            ? 'closed'
            : poll?.starts_at
              ? 'scheduled'
              : 'now',
      themeColor: poll?.theme_color ?? '',
      themeTextColor: poll?.theme_text_color ?? '',
      backgroundImageUrl: poll?.background_image_url ?? '',
      startsAt: poll?.starts_at ? dayjs(poll.starts_at).toISOString() : null,
      endsAt: poll?.ends_at ? dayjs(poll.ends_at).toISOString() : null,
      sourceUrl: poll?.source_url ?? '',
      options: (poll?.options ?? ['', '']).map((label) => ({
        label,
        ...getFlavorPollOptionDetails(poll?.option_details, label),
      })),
    },
  });
  const {
    control,
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors, isSubmitting: saving },
  } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const publication = useWatch({ control, name: 'publication' });
  const activityType = useWatch({ control, name: 'activityType' });
  const themeColor = useWatch({ control, name: 'themeColor' });
  const themeTextColor = useWatch({ control, name: 'themeTextColor' });
  const backgroundImageUrl = useWatch({ control, name: 'backgroundImageUrl' });
  const automaticTextColor = activityTheme(themeColor || theme.palette.primary.main)[
    '--activity-contrast'
  ];
  const isMatching = activityType === 'matching';
  const startsAt = useWatch({ control, name: 'startsAt' });
  const options = useWatch({ control, name: 'options' });
  const [uploading, setUploading] = useState<number | 'background' | null>(null);
  const optionError = errors.options?.root?.message ?? errors.options?.message;

  const submit = handleSubmit(async (values) => {
    if (uploading !== null) return;
    clearErrors('root.save');
    try {
      const error = await saveFlavorPoll(poll?.id ?? null, values);
      if (error) setError('root.save', { message: error });
    } catch (cause) {
      unstable_rethrow(cause);
      setError('root.save', { message: 'บันทึกกิจกรรมไม่สำเร็จ' });
    }
  });

  async function uploadImage(target: number | 'background', file: File) {
    const field =
      target === 'background' ? 'backgroundImageUrl' : (`options.${target}.imageUrl` as const);
    clearErrors(field);
    if (file.size > MAX_FLAVOR_POLL_IMAGE_BYTES) {
      setError(field, { message: 'รูปภาพต้องมีขนาดไม่เกิน 4 MB' });
      return;
    }
    setUploading(target);
    try {
      const data = new FormData();
      data.set('image', file);
      if (target === 'background') data.set('purpose', 'background');
      const response = await fetch('/api/admin/flavor-polls/image/', {
        method: 'POST',
        body: data,
      });
      const result = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!response.ok || !result?.url) throw new Error(result?.error ?? 'อัปโหลดรูปภาพไม่สำเร็จ');
      setValue(field, result.url, { shouldDirty: true, shouldValidate: true });
    } catch (cause) {
      setError(field, {
        message: cause instanceof Error ? cause.message : 'อัปโหลดรูปภาพไม่สำเร็จ',
      });
    } finally {
      setUploading(null);
    }
  }

  return (
    <DashboardContent maxWidth={false}>
      <Stack spacing={3}>
        <Button
          component={Link}
          href={listHref}
          color="inherit"
          startIcon={<Iconify icon="ri:arrow-left-line" />}
          sx={{ alignSelf: 'flex-start' }}
        >
          กลับไปหน้ากิจกรรม
        </Button>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1.5}
        >
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
            {poll ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรม'}
          </Typography>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                สถานะกิจกรรม
              </Typography>
              <Chip
                size="small"
                label={flavorPollPublicationLabel[poll?.status ?? 'draft']}
                color={
                  poll?.status === 'published'
                    ? 'success'
                    : poll?.status === 'upcoming'
                      ? 'info'
                      : 'default'
                }
              />
            </Stack>
            {poll && (
              <Button
                href={`${paths.activity.details(poll.slug ?? poll.id)}?preview=1`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                endIcon={<Iconify icon="ri:external-link-line" />}
                title="พรีวิวข้อมูลที่บันทึกแล้ว"
              >
                พรีวิวหน้าใช้งานจริง
              </Button>
            )}
          </Stack>
        </Stack>
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Form methods={methods} onSubmit={submit}>
            <Stack spacing={3}>
              <Stack component="section" aria-labelledby="activity-info-heading" spacing={2}>
                <Typography id="activity-info-heading" component="h2" variant="subtitle1">
                  ข้อมูลกิจกรรม
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 2fr)' },
                    alignItems: 'start',
                  }}
                >
                  <Field.Text
                    select
                    name="activityType"
                    label="ประเภทกิจกรรม"
                    required
                    slotProps={{ input: { readOnly: Boolean(poll) } }}
                  >
                    <MenuItem value="poll">สร้างโพล</MenuItem>
                    <MenuItem value="matching">เกมจับคู่</MenuItem>
                    <MenuItem value="photo">ส่งภาพถ่าย</MenuItem>
                  </Field.Text>
                  <Field.Text
                    name="title"
                    label="หัวข้อ"
                    required
                    slotProps={{ htmlInput: { maxLength: 140 } }}
                  />
                  <Field.Text
                    name="slug"
                    label="Slug กิจกรรม"
                    sx={{ gridColumn: '1 / -1' }}
                    placeholder="loveza-new-flavor"
                    helperText="ชื่อท้ายลิงก์กิจกรรม เช่น /activities/loveza-new-flavor/"
                    slotProps={{
                      htmlInput: { maxLength: 80, autoCapitalize: 'none', spellCheck: false },
                    }}
                  />
                </Box>
              </Stack>
              <Stack
                component="section"
                aria-labelledby="activity-colors-heading"
                spacing={2}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography id="activity-colors-heading" component="h2" variant="subtitle1">
                  รูปลักษณ์หน้ากิจกรรม
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                    alignItems: 'start',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <TextField
                      label="สีหลักกิจกรรม"
                      type="color"
                      value={themeColor || theme.palette.primary.main}
                      onChange={(event) =>
                        setValue('themeColor', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      error={Boolean(errors.themeColor)}
                      helperText={
                        errors.themeColor?.message ?? (themeColor || 'ใช้สี Primary ของระบบ')
                      }
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ minWidth: 0, width: 1 }}
                    />
                    {themeColor && (
                      <Button
                        onClick={() =>
                          setValue('themeColor', '', { shouldDirty: true, shouldValidate: true })
                        }
                      >
                        ใช้สีระบบ
                      </Button>
                    )}
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <TextField
                      label="สีข้อความหัวกิจกรรม"
                      type="color"
                      value={themeTextColor || automaticTextColor}
                      onChange={(event) =>
                        setValue('themeTextColor', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      error={Boolean(errors.themeTextColor)}
                      helperText={
                        errors.themeTextColor?.message ??
                        (themeTextColor || 'เลือกสีอัตโนมัติตามพื้นหลัง')
                      }
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ minWidth: 0, width: 1 }}
                    />
                    {themeTextColor && (
                      <Button
                        onClick={() =>
                          setValue('themeTextColor', '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        ใช้สีอัตโนมัติ
                      </Button>
                    )}
                  </Stack>
                  <Stack
                    justifyContent="center"
                    alignItems="center"
                    sx={{
                      minHeight: 90,
                      p: 1.5,
                      textAlign: 'center',
                      borderRadius: 1.5,
                      bgcolor: themeColor || theme.palette.primary.main,
                      backgroundImage: backgroundImageUrl
                        ? `url(${JSON.stringify(backgroundImageUrl)})`
                        : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      color: themeTextColor || automaticTextColor,
                    }}
                  >
                    <Typography variant="subtitle2">ตัวอย่างสีข้อความ</Typography>
                  </Stack>
                </Box>
                <Stack alignItems="flex-start" spacing={1}>
                  <Typography variant="subtitle2">ภาพพื้นหลัง</Typography>
                  <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<Iconify icon="ri:image-add-line" />}
                      loading={uploading === 'background'}
                      disabled={saving || uploading !== null}
                    >
                      {backgroundImageUrl ? 'เปลี่ยนภาพพื้นหลัง' : 'อัปโหลดภาพพื้นหลัง'}
                      <input
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (file) void uploadImage('background', file);
                        }}
                      />
                    </Button>
                    {backgroundImageUrl && (
                      <Button
                        color="error"
                        disabled={saving || uploading !== null}
                        onClick={() => {
                          clearErrors('backgroundImageUrl');
                          setValue('backgroundImageUrl', '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                      >
                        ลบภาพพื้นหลัง
                      </Button>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 4 MB
                  </Typography>
                  {errors.backgroundImageUrl?.message && (
                    <Alert severity="error">{errors.backgroundImageUrl.message}</Alert>
                  )}
                </Stack>
              </Stack>
              <Stack spacing={1}>
                <Typography id="activity-description-label" component="h2" variant="subtitle1">
                  รายละเอียดกิจกรรม (ไม่บังคับ)
                </Typography>
                <Controller
                  name="descriptionHtml"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Editor
                      ref={field.ref}
                      value={field.value}
                      onUpdate={({ editor }) => field.onChange(editor.getHTML())}
                      onBlur={field.onBlur}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      placeholder="เขียนคำอธิบาย วิธีร่วมกิจกรรม หรือกติกา"
                      enableFontSize
                      sx={{ '& .tiptap p': { fontSize: '0.875rem' } }}
                      editorProps={{
                        attributes: { 'aria-labelledby': 'activity-description-label' },
                      }}
                    />
                  )}
                />
              </Stack>
              <Stack
                component="section"
                aria-labelledby="activity-publication-title"
                spacing={2}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box>
                  <Typography id="activity-publication-title" component="h2" variant="h6">
                    การเผยแพร่กิจกรรม
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    วันที่และเวลาอ้างอิงเวลาไทย (UTC+7)
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: 'minmax(0, 1fr)',
                      md: 'repeat(auto-fit, minmax(200px, 1fr))',
                    },
                  }}
                >
                  <Field.Text select name="publication" label="เผยแพร่">
                    <MenuItem value="now">เผยแพร่ทันที</MenuItem>
                    <MenuItem value="scheduled">ตั้งวันเริ่ม</MenuItem>
                    <MenuItem value="draft">บันทึกแบบร่าง</MenuItem>
                    {poll && poll.status !== 'draft' && (
                      <MenuItem value="closed">ปิดกิจกรรม</MenuItem>
                    )}
                  </Field.Text>
                  {(publication !== 'now'
                    ? (['startsAt', 'endsAt'] as const)
                    : (['endsAt'] as const)
                  ).map((name) => (
                    <Controller
                      key={name}
                      name={name}
                      control={control}
                      render={({ field, fieldState }) => (
                        <DateTimePicker
                          label={
                            name === 'startsAt'
                              ? publication === 'draft'
                                ? 'วันเริ่ม (ไม่บังคับ)'
                                : 'วันเริ่ม'
                              : 'วันสิ้นสุด (ไม่บังคับ)'
                          }
                          timezone="Asia/Bangkok"
                          format="DD/MM/YYYY HH:mm"
                          ampm={false}
                          slots={{
                            openPickerIcon: CalendarIcon,
                            leftArrowIcon: PreviousMonthIcon,
                            rightArrowIcon: NextMonthIcon,
                            switchViewIcon: SwitchCalendarViewIcon,
                          }}
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) =>
                            field.onChange(
                              date ? (date.isValid() ? date.toISOString() : 'invalid') : null
                            )
                          }
                          inputRef={field.ref}
                          disabled={saving}
                          minDateTime={
                            name === 'endsAt' &&
                            publication !== 'now' &&
                            startsAt &&
                            dayjs(startsAt).isValid()
                              ? dayjs(startsAt)
                              : undefined
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: name === 'startsAt' && publication === 'scheduled',
                              onBlur: field.onBlur,
                              error: Boolean(fieldState.error),
                              helperText: fieldState.error?.message,
                            },
                            actionBar: { actions: ['clear', 'cancel', 'accept'] },
                            tabs: {
                              dateIcon: <CalendarIcon />,
                              timeIcon: <Iconify icon="ri:time-line" width={22} />,
                            },
                          }}
                        />
                      )}
                    />
                  ))}
                </Box>
                <Field.Text
                  name="sourceUrl"
                  type="url"
                  label="URL ต้นทางกิจกรรม (ไม่บังคับ)"
                  placeholder="https://…"
                  helperText="เช่น ลิงก์โพสต์ต้นทางจากเพจของแบรนด์"
                  slotProps={{ htmlInput: { maxLength: 2048 } }}
                />
              </Stack>
              {activityType !== 'photo' && (
                <Stack component="section" aria-labelledby="flavor-options-title" spacing={2}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
                    flexWrap="wrap"
                  >
                    <Box>
                      <Typography id="flavor-options-title" component="h2" variant="h6">
                        {isMatching ? 'คู่การ์ด' : 'ตัวเลือก'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {optionsLocked
                          ? votesError
                            ? 'โหลดผลโหวตไม่สำเร็จ'
                            : 'มีผลโหวตแล้ว แก้ไขได้เฉพาะรูปและรายละเอียด'
                          : isMatching
                            ? `${fields.length} คู่ · ระบบสร้างการ์ดสองใบต่อรายการ`
                            : `มี ${fields.length} ตัวเลือก · กำหนดได้ 2–12 ตัวเลือก`}
                      </Typography>
                    </Box>
                    {!optionsLocked && (
                      <Button
                        type="button"
                        variant="outlined"
                        disabled={saving || fields.length >= 12}
                        startIcon={<Iconify icon="ri:add-line" />}
                        onClick={() => append({ label: '', imageUrl: '', description: '' })}
                      >
                        {isMatching ? 'เพิ่มคู่การ์ด' : 'เพิ่มตัวเลือก'}
                      </Button>
                    )}
                  </Stack>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: {
                        xs: 'minmax(0, 1fr)',
                        md: 'repeat(2, minmax(0, 1fr))',
                        lg: isMatching ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                      },
                    }}
                  >
                    {fields.map(({ id }, index) => {
                      const imageUrl = options[index]?.imageUrl;
                      return (
                        <Stack
                          key={id}
                          spacing={1.5}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                          }}
                        >
                          {isMatching && (
                            <TextField
                              select
                              size="small"
                              label="เติมจากสินค้า"
                              value=""
                              disabled={
                                optionsLocked ||
                                saving ||
                                uploading !== null ||
                                !cardProducts.length
                              }
                              helperText={
                                cardProductsError
                                  ? 'โหลดรายการสินค้าไม่สำเร็จ'
                                  : !cardProducts.length
                                    ? 'ยังไม่มีสินค้าที่เปิดแสดง'
                                    : undefined
                              }
                              onChange={(event) => {
                                const product = cardProducts.find(
                                  ({ id: productId }) => productId === event.target.value
                                );
                                if (!product) return;
                                setValue(
                                  `options.${index}`,
                                  {
                                    label: product.label,
                                    description: product.description,
                                    imageUrl: product.imageUrl,
                                  },
                                  { shouldDirty: true, shouldValidate: true }
                                );
                              }}
                            >
                              {cardProducts.map((product) => (
                                <MenuItem key={product.id} value={product.id}>
                                  <Stack direction="row" spacing={1.25} alignItems="center">
                                    {product.imageUrl && (
                                      <Box
                                        component="img"
                                        src={product.imageUrl}
                                        alt=""
                                        sx={{ width: 30, height: 30, objectFit: 'contain' }}
                                      />
                                    )}
                                    {product.label}
                                  </Stack>
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Field.Text
                              name={`options.${index}.label`}
                              label={`${isMatching ? 'คู่การ์ด' : 'ตัวเลือก'}ที่ ${index + 1}`}
                              fullWidth
                              size="small"
                              required
                              slotProps={{ htmlInput: { maxLength: 80, readOnly: optionsLocked } }}
                            />
                            {!optionsLocked && (
                              <IconButton
                                type="button"
                                aria-label={`ลบตัวเลือกที่ ${index + 1}`}
                                color="error"
                                disabled={saving || uploading !== null || fields.length <= 2}
                                onClick={() => remove(index)}
                              >
                                <Iconify icon="ri:delete-bin-6-line" />
                              </IconButton>
                            )}
                          </Stack>
                          <Field.Text
                            name={`options.${index}.description`}
                            label="รายละเอียด (ไม่บังคับ)"
                            multiline
                            minRows={2}
                            slotProps={{ htmlInput: { maxLength: 500 } }}
                          />
                          {imageUrl && (
                            <Box
                              component="img"
                              src={imageUrl}
                              alt={`รูปตัวเลือกที่ ${index + 1}`}
                              sx={{
                                width: 1,
                                height: 160,
                                objectFit: 'contain',
                                bgcolor: 'background.neutral',
                                borderRadius: 1,
                              }}
                            />
                          )}
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Button
                              component="label"
                              variant="outlined"
                              size="small"
                              disabled={saving || uploading !== null}
                              startIcon={<Iconify icon="ri:image-add-line" />}
                              sx={{ '&:focus-within': { outline: '2px solid', outlineOffset: 2 } }}
                            >
                              {uploading === index
                                ? 'กำลังอัปโหลด'
                                : imageUrl
                                  ? 'เปลี่ยนรูป'
                                  : 'เพิ่มรูป'}
                              <Box
                                component="input"
                                type="file"
                                sx={{
                                  position: 'absolute',
                                  width: '1px',
                                  height: '1px',
                                  p: 0,
                                  overflow: 'hidden',
                                  clipPath: 'inset(50%)',
                                }}
                                accept="image/jpeg,image/png,image/webp"
                                disabled={saving || uploading !== null}
                                aria-label={`อัปโหลดรูปตัวเลือกที่ ${index + 1}`}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  event.target.value = '';
                                  if (file) void uploadImage(index, file);
                                }}
                              />
                            </Button>
                            {imageUrl && (
                              <Button
                                type="button"
                                color="error"
                                size="small"
                                disabled={saving || uploading !== null}
                                onClick={() =>
                                  setValue(`options.${index}.imageUrl`, '', {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  })
                                }
                              >
                                นำรูปออก
                              </Button>
                            )}
                          </Stack>
                          {errors.options?.[index]?.imageUrl?.message && (
                            <Alert severity="error">
                              {errors.options[index]?.imageUrl?.message}
                            </Alert>
                          )}
                        </Stack>
                      );
                    })}
                  </Box>
                </Stack>
              )}
              {activityType !== 'photo' && optionError && (
                <Alert severity="error">{optionError}</Alert>
              )}
              {errors.root?.save?.message && (
                <Alert severity="error">{errors.root.save.message}</Alert>
              )}
              <Stack
                direction="row"
                spacing={1}
                justifyContent="flex-end"
                useFlexGap
                flexWrap="wrap"
              >
                <Button component={Link} href={listHref} color="inherit">
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  loading={saving}
                  disabled={uploading !== null}
                >
                  {publication === 'draft'
                    ? 'บันทึกแบบร่าง'
                    : publication === 'closed'
                      ? 'บันทึกและปิดกิจกรรม'
                      : poll
                        ? 'บันทึกกิจกรรม'
                        : publication === 'scheduled'
                          ? 'สร้างและตั้งเวลา'
                          : 'สร้างและเผยแพร่'}
                </Button>
              </Stack>
            </Stack>
          </Form>
        </Card>
      </Stack>
    </DashboardContent>
  );
}
