'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';

import { REWARD_SOURCES, type RewardRule } from 'src/lib/explorer/reward-rules';
import { rewardRuleSchema, type RewardRuleInput } from 'src/app/admin/reward-rules/schema';

import { Iconify } from 'src/components/iconify';

const defaults: RewardRuleInput = {
  id: '',
  name: '',
  source: 'uniqueStores',
  unit: 'ร้าน',
  description: '',
  max_target: 9999,
  sort_order: 10,
  is_active: true,
};
export function RewardRulesPanel({ rules, hasError }: { rules: RewardRule[]; hasError: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState<RewardRule | null>(null),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(0),
    [size, setSize] = useState(10);
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RewardRuleInput>({
    resolver: zodResolver(rewardRuleSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  });
  const currentPage = Math.min(page, Math.max(0, Math.ceil(rules.length / size) - 1));
  function show(rule?: RewardRule) {
    reset(rule ?? { ...defaults, sort_order: (rules.length + 1) * 10 });
    setEditing(Boolean(rule));
    setError('');
    setOpen(true);
  }
  async function save(values: RewardRuleInput) {
    setError('');
    try {
      const r = await fetch('/api/admin/reward-rules/', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setOpen(false);
      setSuccess('บันทึกเงื่อนไขแล้ว');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    }
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/reward-rules/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleting.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setDeleting(null);
      setSuccess('ลบเงื่อนไขแล้ว');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h4">Master เงื่อนไขรางวัล</Typography>
          <Typography color="text.secondary">
            กำหนดชื่อ หน่วย วิธีนับ และเป้าหมายสูงสุดสำหรับการ์ดรางวัล
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => show()}
          disabled={hasError}
          startIcon={<Iconify icon="ri:add-line" />}
        >
          เพิ่มเงื่อนไข
        </Button>
      </Stack>
      <Button href="/admin/rewards/" sx={{ alignSelf: 'flex-start' }}>
        กลับไปจัดการรางวัล
      </Button>
      <Alert severity="info">
        ปิดใช้งานเพื่อหยุดเลือกในรางวัลใหม่ รางวัลเดิมยังนับต่อได้
        ลบได้เฉพาะเงื่อนไขที่ไม่มีรางวัลใช้ และเปลี่ยนวิธีนับไม่ได้เมื่อมีรางวัลใช้อยู่
      </Alert>
      {hasError && <Alert severity="error">โหลดเงื่อนไขไม่สำเร็จ</Alert>}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && !open && !deleting && <Alert severity="error">{error}</Alert>}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 850 }} aria-label="Master เงื่อนไขรางวัล">
          <TableHead>
            <TableRow>
              {['เงื่อนไข', 'วิธีนับ', 'หน่วย / เป้าหมายสูงสุด', 'ลำดับ', 'สถานะ', 'จัดการ'].map(
                (t) => (
                  <TableCell key={t}>{t}</TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.slice(currentPage * size, (currentPage + 1) * size).map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>
                  <Typography fontWeight={800}>{r.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.id} · {r.description}
                  </Typography>
                </TableCell>
                <TableCell>{REWARD_SOURCES[r.source]}</TableCell>
                <TableCell>
                  {r.unit} / {r.max_target}
                </TableCell>
                <TableCell>{r.sort_order}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={r.is_active ? 'success' : 'default'}
                    label={r.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button onClick={() => show(r)}>แก้ไข</Button>
                    <Button
                      color="error"
                      onClick={() => {
                        setError('');
                        setDeleting(r);
                      }}
                    >
                      ลบ
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!rules.length && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  ยังไม่มีเงื่อนไข
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={rules.length}
          page={currentPage}
          rowsPerPage={size}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setSize(Number(e.target.value));
            setPage(0);
          }}
          labelRowsPerPage="แสดงต่อหน้า"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count}`}
        />
      </TableContainer>
      <Dialog
        open={open}
        onClose={isSubmitting ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editing ? 'แก้ไขเงื่อนไข' : 'เพิ่มเงื่อนไข'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="rule-form" noValidate onSubmit={handleSubmit(save)}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="ชื่อเงื่อนไข"
                {...register('name')}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                disabled={isSubmitting}
              />
              <TextField
                label="รหัสเงื่อนไข"
                {...register('id')}
                error={Boolean(errors.id)}
                helperText={errors.id?.message || 'รหัสอ้างอิง แก้ไม่ได้หลังสร้าง'}
                slotProps={{ input: { readOnly: editing } }}
                disabled={isSubmitting}
              />
              <Controller
                name="source"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    select
                    label="วิธีนับข้อมูล"
                    error={Boolean(fieldState.error)}
                    helperText={
                      fieldState.error?.message || 'คำนวณจากข้อมูลที่ผ่านอนุมัติฝั่งเซิร์ฟเวอร์'
                    }
                    disabled={isSubmitting}
                  >
                    {Object.entries(REWARD_SOURCES).map(([id, label]) => (
                      <MenuItem key={id} value={id}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                label="หน่วย เช่น ร้าน วัน ครั้ง"
                {...register('unit')}
                error={Boolean(errors.unit)}
                helperText={errors.unit?.message}
                disabled={isSubmitting}
              />
              <TextField
                label="คำอธิบาย"
                multiline
                minRows={2}
                {...register('description')}
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
                disabled={isSubmitting}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="เป้าหมายสูงสุด"
                  {...register('max_target', { valueAsNumber: true })}
                  error={Boolean(errors.max_target)}
                  helperText={errors.max_target?.message}
                  disabled={isSubmitting}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="ลำดับ"
                  {...register('sort_order', { valueAsNumber: true })}
                  error={Boolean(errors.sort_order)}
                  helperText={errors.sort_order?.message}
                  disabled={isSubmitting}
                />
              </Stack>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    label="เปิดให้เลือกในรางวัลใหม่"
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(_, v) => field.onChange(v)}
                        disabled={isSubmitting}
                      />
                    }
                  />
                )}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button disabled={isSubmitting} onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button variant="contained" type="submit" form="rule-form" disabled={isSubmitting}>
            {isSubmitting ? 'กำลังบันทึก…' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={busy ? undefined : () => setDeleting(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>ลบเงื่อนไขนี้?</DialogTitle>
        <DialogContent>
          <Typography>{deleting?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            ถ้ามีรางวัลอ้างอิงอยู่ ระบบจะป้องกันการลบ
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setDeleting(null)}>
            ยกเลิก
          </Button>
          <Button color="error" variant="contained" disabled={busy} onClick={remove}>
            ยืนยันลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
