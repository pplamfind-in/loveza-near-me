'use client';

import type { PathValue } from 'react-hook-form';
import type { ExplorerReward } from 'src/lib/explorer/rewards';
import type { RewardInput } from 'src/app/admin/rewards/schema';

import dayjs from 'dayjs';
import { useState } from 'react';
import utc from 'dayjs/plugin/utc';
import { useRouter } from 'next/navigation';
import timezone from 'dayjs/plugin/timezone';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { rewardSchema } from 'src/app/admin/rewards/schema';
import { type RewardRule, formatRewardCondition } from 'src/lib/explorer/reward-rules';
import { type RewardProduct, rewardProductFlavor } from 'src/lib/explorer/reward-product';

import { Iconify } from 'src/components/iconify';

dayjs.extend(utc);
dayjs.extend(timezone);

export function RewardsPanel({
  rewards,
  characters,
  rules,
  products,
  hasError,
}: {
  rewards: ExplorerReward[];
  characters: string[];
  rules: RewardRule[];
  products: RewardProduct[];
  hasError: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const empty: RewardInput = {
    id: '',
    name: '',
    character: characters[0] ?? '',
    metric: rules.find((rule) => rule.is_active)?.id ?? '',
    target: 1,
    color: '#E8F0E4',
    sort_order: (rewards.length + 1) * 10,
    is_active: true,
    required_product_id: null,
    starts_at: null,
    ends_at: null,
  };
  const {
    control,
    register,
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting: pending },
  } = useForm<RewardInput>({
    resolver: zodResolver(
      rewardSchema.superRefine((values, context) => {
        const rule = rules.find((item) => item.id === values.metric);
        if (!rule)
          context.addIssue({
            code: 'custom',
            path: ['metric'],
            message: 'กรุณาเลือกเงื่อนไขจาก Master',
          });
        else if (values.target > rule.max_target)
          context.addIssue({
            code: 'custom',
            path: ['target'],
            message: `เป้าหมายต้องไม่เกิน ${rule.max_target} ${rule.unit}`,
          });
      })
    ),
    defaultValues: empty,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const form = watch();
  const selectedRule = rules.find((rule) => rule.id === form.metric);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(rewards.length / size) - 1));
  const setField = <K extends keyof RewardInput>(key: K, value: RewardInput[K]) =>
    setValue(key, value as PathValue<RewardInput, K>, { shouldDirty: true, shouldValidate: true });
  const show = (reward?: ExplorerReward) => {
    setEditing(Boolean(reward));
    setError('');
    setSuccess('');
    reset(
      reward
        ? {
            id: reward.id,
            name: reward.name,
            character: reward.character,
            metric: reward.metric,
            target: reward.target,
            color: reward.color,
            sort_order: reward.sort_order ?? 0,
            is_active: reward.is_active ?? true,
            required_product_id: reward.required_product_id ?? null,
            starts_at: reward.starts_at ?? null,
            ends_at: reward.ends_at ?? null,
          }
        : empty
    );
    setOpen(true);
  };
  const save = async (values: RewardInput) => {
    setError('');
    try {
      const response = await fetch('/api/admin/rewards/', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'บันทึกไม่สำเร็จ');
      setOpen(false);
      setSuccess('บันทึกรางวัลแล้ว');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'บันทึกไม่สำเร็จ');
    }
  };
  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
        <Box>
          <Typography component="h1" sx={{ fontSize: 32, fontWeight: 900 }}>
            รางวัลนักสำรวจ
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            จัดการการ์ดตัวละครและเงื่อนไขปลดล็อกจากพิกัดที่ผ่านอนุมัติ
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => show()}
          startIcon={<Iconify icon="ri:add-line" />}
          sx={{ alignSelf: 'flex-start' }}
          disabled={hasError || characters.length === 0 || !rules.some((rule) => rule.is_active)}
        >
          เพิ่มรางวัล
        </Button>
      </Stack>

      <Button
        href="/admin/reward-rules/"
        startIcon={<Iconify icon="ri:list-check-3" />}
        sx={{ alignSelf: 'flex-start' }}
      >
        จัดการ Master เงื่อนไขรางวัล
      </Button>
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {hasError && <Alert severity="error">โหลดรายการรางวัลไม่สำเร็จ กรุณาลองใหม่</Alert>}
      <TableContainer component={Paper} elevation={0}>
        <Table sx={{ minWidth: 940 }} aria-label="รางวัลนักสำรวจ">
          <TableHead>
            <TableRow>
              <TableCell>การ์ดรางวัล</TableCell>
              <TableCell>ภารกิจปลดล็อก</TableCell>
              <TableCell align="center">ลำดับ</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="right">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rewards.slice(currentPage * size, (currentPage + 1) * size).map((reward) => (
              <TableRow key={reward.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      component="img"
                      src={`/assets/illustrations/${reward.character}`}
                      alt=""
                      sx={{
                        width: 56,
                        height: 76,
                        objectFit: 'contain',
                        bgcolor: reward.color,
                        borderRadius: '10px',
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>{reward.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {reward.id}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  {reward.condition}
                  {reward.required_product_name && (
                    <Typography variant="caption" display="block" color="primary">
                      ต้องพบ {reward.required_product_name}
                    </Typography>
                  )}
                  {reward.starts_at && (
                    <Typography variant="caption" display="block" color="primary">
                      การ์ดพิเศษ ·{' '}
                      {new Date(reward.starts_at).toLocaleDateString('th-TH', {
                        timeZone: 'Asia/Bangkok',
                      })}{' '}
                      –{' '}
                      {new Date(reward.ends_at!).toLocaleDateString('th-TH', {
                        timeZone: 'Asia/Bangkok',
                      })}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">{reward.sort_order}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={reward.is_active ? 'success' : 'default'}
                    label={reward.is_active ? 'แสดง' : 'ซ่อน'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Iconify icon="ri:edit-2-line" />}
                    onClick={() => show(reward)}
                  >
                    แก้ไข
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!rewards.length && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  ยังไม่มีรางวัล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={rewards.length}
          page={currentPage}
          rowsPerPage={size}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, value) => setPage(value)}
          onRowsPerPageChange={(event) => {
            setSize(Number(event.target.value));
            setPage(0);
          }}
          labelRowsPerPage="แสดงต่อหน้า"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count}`}
          getItemAriaLabel={(type) =>
            ({
              first: 'ไปหน้าแรก',
              last: 'ไปหน้าสุดท้าย',
              next: 'ไปหน้าถัดไป',
              previous: 'ไปหน้าก่อนหน้า',
            })[type]
          }
          showFirstButton
          showLastButton
        />
      </TableContainer>
      <Dialog
        open={open}
        onClose={pending ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="md"
        aria-labelledby="reward-editor-title"
      >
        <DialogTitle id="reward-editor-title">
          {editing ? 'แก้ไขรางวัล' : 'เพิ่มรางวัล'}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            id="reward-editor-form"
            noValidate
            onSubmit={handleSubmit(save)}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '240px 1fr' },
              gap: 3,
              pt: 1,
            }}
          >
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <Box
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: form.color,
                  border: '5px solid white',
                  borderRadius: '18px',
                  position: { md: 'sticky' },
                  top: 0,
                }}
              >
                {characters.includes(form.character) && (
                  <Box
                    component="img"
                    src={`/assets/illustrations/${form.character}`}
                    alt="ตัวอย่างการ์ด"
                    sx={{
                      width: '100%',
                      height: { xs: 150, md: 270 },
                      objectFit: 'contain',
                      objectPosition: 'bottom',
                    }}
                  />
                )}
                <Typography sx={{ mt: 1, fontWeight: 800 }}>{form.name || 'ชื่อรางวัล'}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                ตัวอย่างการ์ด · ภาพและสีที่จะแสดงให้ผู้เล่น
              </Typography>
            </Stack>
            <Stack spacing={2}>
              <TextField
                size="small"
                label="ชื่อรางวัล"
                required
                name="name"
                inputRef={register('name').ref}
                value={form.name}
                error={Boolean(errors.name)}
                onBlur={() => setValue('name', form.name, { shouldValidate: true })}
                helperText={errors.name?.message}
                disabled={pending}
                onChange={(event) => setField('name', event.target.value)}
              />
              <TextField
                size="small"
                label="รหัสรางวัล"
                required
                disabled={editing || pending}
                name="id"
                inputRef={register('id').ref}
                value={form.id}
                error={Boolean(errors.id)}
                onBlur={() => setValue('id', form.id, { shouldValidate: true })}
                helperText={errors.id?.message || 'a-z ตัวเลข และขีดกลาง · แก้รหัสหลังสร้างไม่ได้'}
                onChange={(event) => setField('id', event.target.value)}
              />
              <TextField
                select
                size="small"
                label="ตัวละครจากโฟลเดอร์ illustrations"
                name="character"
                inputRef={register('character').ref}
                value={form.character}
                error={Boolean(errors.character)}
                onBlur={() => setValue('character', form.character, { shouldValidate: true })}
                helperText={errors.character?.message}
                disabled={pending}
                onChange={(event) => setField('character', event.target.value)}
              >
                {characters.map((file) => (
                  <MenuItem key={file} value={file}>
                    {file}
                  </MenuItem>
                ))}
              </TextField>
              <Controller
                name="required_product_id"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    select
                    size="small"
                    label="สินค้าที่ต้องพบ"
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value || null)}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    helperText={
                      fieldState.error?.message ||
                      'ระบุสินค้าตรงตัว ไม่เปลี่ยนตามป้าย NEW · นับเฉพาะแจ้งพบสินค้าและผ่านอนุมัติ'
                    }
                    disabled={pending}
                  >
                    <MenuItem value="">ทุกสินค้า (ไม่กรองรสชาติ)</MenuItem>
                    {products
                      .filter(
                        (product) => product.is_active || product.id === form.required_product_id
                      )
                      .map((product) => (
                        <MenuItem
                          key={product.id}
                          value={product.id}
                          disabled={
                            !rewardProductFlavor(product.slug) ||
                            (!product.is_active && product.id !== form.required_product_id)
                          }
                        >
                          {product.thai_name}
                          {product.is_new ? ' · NEW' : ''}
                          {!rewardProductFlavor(product.slug) ? ' · ยังไม่รองรับการแจ้ง' : ''}
                        </MenuItem>
                      ))}
                  </TextField>
                )}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="นับความคืบหน้าจาก"
                  name="metric"
                  inputRef={register('metric').ref}
                  value={form.metric}
                  error={Boolean(errors.metric)}
                  onBlur={() => setValue('metric', form.metric, { shouldValidate: true })}
                  helperText={errors.metric?.message}
                  disabled={pending}
                  onChange={(event) =>
                    setField('metric', event.target.value as RewardInput['metric'])
                  }
                >
                  {rules
                    .filter((rule) => rule.is_active || rule.id === form.metric)
                    .map((rule) => (
                      <MenuItem key={rule.id} value={rule.id} disabled={!rule.is_active}>
                        {rule.name}
                        {!rule.is_active ? ' (ปิดใช้งาน)' : ''}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="เป้าหมาย"
                  name="target"
                  inputRef={register('target').ref}
                  value={form.target}
                  error={Boolean(errors.target)}
                  onBlur={() => setValue('target', form.target, { shouldValidate: true })}
                  helperText={errors.target?.message}
                  disabled={pending}
                  slotProps={{
                    htmlInput: { min: 1, max: selectedRule?.max_target ?? 9999 },
                  }}
                  onChange={(event) => setField('target', Number(event.target.value))}
                />
              </Stack>
              <Typography
                sx={{ p: 1.5, fontSize: 13, bgcolor: 'primary.lighter', borderRadius: '10px' }}
              >
                {selectedRule
                  ? formatRewardCondition(selectedRule, form.target)
                  : 'เลือกเงื่อนไขจาก Master'}
                {form.required_product_id &&
                  ` · ต้องพบ ${products.find((product) => product.id === form.required_product_id)?.thai_name ?? ''}`}
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="สีการ์ด"
                  type="color"
                  name="color"
                  inputRef={register('color').ref}
                  value={form.color}
                  error={Boolean(errors.color)}
                  onBlur={() => setValue('color', form.color, { shouldValidate: true })}
                  helperText={errors.color?.message}
                  disabled={pending}
                  onChange={(event) => setField('color', event.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="ลำดับ"
                  type="number"
                  name="sort_order"
                  inputRef={register('sort_order').ref}
                  value={form.sort_order}
                  error={Boolean(errors.sort_order)}
                  onBlur={() => setValue('sort_order', form.sort_order, { shouldValidate: true })}
                  helperText={errors.sort_order?.message}
                  disabled={pending}
                  onChange={(event) => setField('sort_order', Number(event.target.value))}
                />
              </Stack>
              <Box sx={{ p: 2, bgcolor: '#FBF0CD', borderRadius: '12px' }}>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>การ์ดพิเศษ · ช่วงเวลาตามหา</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  เว้นว่างทั้งคู่สำหรับรางวัลปกติ นับเฉพาะพิกัดที่แจ้งในช่วงกิจกรรมและผ่านอนุมัติ
                  ผู้ที่ปลดล็อกแล้วยังดาวน์โหลดได้หลังจบกิจกรรม
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {(['starts_at', 'ends_at'] as const).map((field) => (
                    <Controller
                      key={field}
                      name={field}
                      control={control}
                      render={({ field: dateField, fieldState }) => (
                        <DateTimePicker
                          label={field === 'starts_at' ? 'เริ่มกิจกรรม' : 'สิ้นสุดกิจกรรม'}
                          timezone="Asia/Bangkok"
                          format="DD/MM/YYYY HH:mm"
                          ampm={false}
                          value={dateField.value ? dayjs(dateField.value) : null}
                          onChange={(value) =>
                            dateField.onChange(
                              value?.isValid()
                                ? value.toISOString()
                                : value === null
                                  ? null
                                  : 'invalid'
                            )
                          }
                          disabled={pending}
                          minDateTime={
                            field === 'ends_at' && form.starts_at && dayjs(form.starts_at).isValid()
                              ? dayjs(form.starts_at)
                              : undefined
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                              onBlur: dateField.onBlur,
                              error: Boolean(fieldState.error),
                              helperText: fieldState.error?.message || 'เวลาไทย (UTC+7)',
                            },
                            actionBar: { actions: ['clear', 'cancel', 'accept'] },
                          }}
                        />
                      )}
                    />
                  ))}
                </Stack>
              </Box>
              <FormControlLabel
                control={
                  <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        disabled={pending}
                        onChange={(_, checked) => field.onChange(checked)}
                      />
                    )}
                  />
                }
                label="แสดงรางวัลและเปิดให้ดาวน์โหลดเมื่อปลดล็อก"
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" disabled={pending} onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button variant="contained" disabled={pending} type="submit" form="reward-editor-form">
            {pending ? 'กำลังบันทึก…' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
