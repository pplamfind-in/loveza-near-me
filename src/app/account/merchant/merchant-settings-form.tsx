'use client';

import type { MerchantSettings } from './settings-schema';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { STORE_LOGO_MAX_BYTES, STORE_LOGO_MIME_TYPES } from 'src/lib/supabase/store-logo';

import { Form, Field } from 'src/components/hook-form';

import { merchantSettingsSchema } from './settings-schema';
import { saveMerchantSettings, updateMerchantVisibility } from './actions';

type StoreOption = { code: string; name: string; logo_url: string | null };

type MerchantSettingsProps = {
  defaults: MerchantSettings;
  stores: StoreOption[];
  currentLogoUrl: string | null;
};

export function MerchantSettingsCard({
  storeName,
  visible,
  defaults,
  stores,
  currentLogoUrl,
}: MerchantSettingsProps & { storeName?: string; visible?: boolean }) {
  const [open, setOpen] = useState(false);
  const logo =
    currentLogoUrl ||
    stores.find(({ code }) => code === defaults.store_type_code)?.logo_url ||
    '/assets/icons/loveza/voxel-store.svg';

  return (
    <>
      <Card variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Box
            component="img"
            src={logo}
            alt=""
            sx={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 1, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1, minWidth: 120, overflowWrap: 'anywhere' }}>
            <Typography variant="subtitle1" component="h3">
              {storeName || 'ร้านของฉัน'}
            </Typography>
            {visible === false && (
              <Typography variant="body2" color="text.secondary">
                ซ่อนจากแผนที่แล้ว
              </Typography>
            )}
            {defaults.branch_name && (
              <Typography variant="body2" color="text.secondary">
                {defaults.branch_name}
              </Typography>
            )}
          </Box>
          {visible !== undefined && <MerchantVisibilityButton visible={visible} />}
          <Button variant="outlined" onClick={() => setOpen(true)} aria-haspopup="dialog">
            {storeName ? 'แก้ไขร้านค้า' : 'ตั้งค่าร้าน'}
          </Button>
        </Stack>
      </Card>
      <MerchantSettingsDialog
        open={open}
        title={storeName ? 'แก้ไขร้านค้า' : 'ตั้งค่าร้าน'}
        defaults={defaults}
        stores={stores}
        currentLogoUrl={currentLogoUrl}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function MerchantVisibilityButton({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const label = visible ? 'ซ่อนร้านจากแผนที่' : 'แสดงร้านบนแผนที่';

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const message = await updateMerchantVisibility(!visible);
      if (message) setError(message);
      else setOpen(false);
    } catch {
      setError('เปลี่ยนการแสดงร้านไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        aria-haspopup="dialog"
        onClick={() => {
          setError('');
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={saving ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="merchant-visibility-title"
      >
        <DialogTitle id="merchant-visibility-title">{label}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              {visible
                ? 'หมุดร้านจะหายจากแผนที่และหน้าค้นหาร้าน คุณเปิดแสดงร้านอีกครั้งได้จากหน้านี้'
                : 'นักสำรวจจะเห็นหมุดร้านและสต็อกที่บันทึกไว้ในแผนที่และหน้าค้นหาร้าน'}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pt: 2, pb: 3, flexWrap: 'wrap' }}>
          <Button disabled={saving} onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button variant="contained" loading={saving} onClick={save}>
            {label}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function AddMerchantButton({ stores }: { stores: StoreOption[] | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" fullWidth onClick={() => setOpen(true)} aria-haspopup="dialog">
        + เพิ่มร้านของฉัน
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        ปักหมุดร้านและแจ้งรสที่มี ให้คนตามหารู้ก่อนเดินทาง
      </Typography>
      <MerchantSettingsDialog
        open={open}
        title="ตั้งค่าร้านค้า"
        createFromProfile
        defaults={{ name: '', branch_name: '', store_type_code: '', logo: null, removeLogo: false }}
        stores={stores}
        currentLogoUrl={null}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function MerchantSettingsDialog({
  open,
  title,
  defaults,
  stores,
  currentLogoUrl,
  createFromProfile,
  onClose,
}: Omit<MerchantSettingsProps, 'stores'> & {
  open: boolean;
  title: string;
  stores: StoreOption[] | null;
  createFromProfile?: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="merchant-settings-title"
    >
      <DialogTitle id="merchant-settings-title">{title}</DialogTitle>
      <DialogContent dividers>
        <Stack sx={{ py: 2 }}>
          {open &&
            (stores ? (
              <MerchantSettingsForm
                defaults={defaults}
                stores={stores}
                currentLogoUrl={currentLogoUrl}
                createFromProfile={createFromProfile}
                onSaved={onClose}
                onCancel={onClose}
              />
            ) : (
              <Alert severity="error">โหลดข้อมูลร้านจาก Master ไม่สำเร็จ กรุณาโหลดหน้าใหม่</Alert>
            ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function MerchantSettingsForm({
  defaults,
  stores,
  currentLogoUrl,
  createFromProfile,
  onSaved,
  onCancel,
}: MerchantSettingsProps & {
  createFromProfile?: boolean;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const methods = useForm<MerchantSettings>({
    resolver: zodResolver(merchantSettingsSchema),
    defaultValues: defaults,
  });
  const [selectedCode, removeLogo, logo] = useWatch({
    control: methods.control,
    name: ['store_type_code', 'removeLogo', 'logo'],
  });
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview);
    return undefined;
  }, [preview]);
  const storeByCode = new Map(stores.map((store) => [store.code, store]));
  const optionLabel = (code: string) => storeByCode.get(code)?.name ?? 'กรอกชื่อร้านเอง';
  const previewLogo =
    preview ||
    (!removeLogo ? currentLogoUrl : null) ||
    storeByCode.get(selectedCode)?.logo_url ||
    '/assets/icons/loveza/voxel-store.svg';
  const submit = methods.handleSubmit(async (values) => {
    methods.clearErrors('root');
    const data = new FormData();
    data.set('name', values.name);
    data.set('branch_name', values.branch_name);
    data.set('store_type_code', values.store_type_code);
    data.set('removeLogo', String(values.removeLogo));
    if (values.logo) data.set('logo', values.logo);

    const error = await saveMerchantSettings(data, createFromProfile);
    if (error) methods.setError('root', { message: error });
    else onSaved();
  });

  return (
    <Form methods={methods} onSubmit={submit}>
      <Stack spacing={2}>
        <Field.Autocomplete
          name="store_type_code"
          label="ร้านค้าจากข้อมูล Master"
          options={['', ...stores.map(({ code }) => code)]}
          getOptionLabel={optionLabel}
          disableClearable
          renderOption={(props, code: string) => {
            const { key, ...optionProps } = props;
            const optionLogo =
              storeByCode.get(code)?.logo_url || '/assets/icons/loveza/voxel-store.svg';

            return (
              <li key={key} {...optionProps}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box
                    component="img"
                    src={optionLogo}
                    alt=""
                    sx={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
                  />
                  <span>{optionLabel(code)}</span>
                </Stack>
              </li>
            );
          }}
        />
        {!selectedCode && (
          <Field.Text
            name="name"
            label="ชื่อร้านที่กรอกเอง"
            required
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
        )}
        <Field.Text
          name="branch_name"
          label="ชื่อสาขา (ถ้ามี)"
          placeholder="เช่น บางนา 14"
          slotProps={{ htmlInput: { maxLength: 120 } }}
        />
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            component="img"
            src={previewLogo}
            alt="ตัวอย่างโลโก้ร้าน"
            sx={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 1 }}
          />
          <Stack alignItems="flex-start" spacing={0.5}>
            <Typography variant="subtitle2">โลโก้ร้านของฉัน</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button
                component="label"
                variant="outlined"
                size="small"
                disabled={methods.formState.isSubmitting}
              >
                {currentLogoUrl && !removeLogo ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'}
                <Box
                  component="input"
                  type="file"
                  accept={STORE_LOGO_MIME_TYPES.join(',')}
                  disabled={methods.formState.isSubmitting}
                  sx={{ position: 'absolute', width: '1px', height: '1px', clipPath: 'inset(50%)' }}
                  aria-label="เลือกไฟล์โลโก้ร้าน"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    methods.setValue('logo', file, { shouldDirty: true, shouldValidate: true });
                    methods.setValue('removeLogo', false, { shouldDirty: true });
                    const canPreview =
                      file.size <= STORE_LOGO_MAX_BYTES &&
                      STORE_LOGO_MIME_TYPES.some((type) => type === file.type);
                    setPreview(canPreview ? URL.createObjectURL(file) : null);
                  }}
                />
              </Button>
              {(logo || (currentLogoUrl && !removeLogo)) && (
                <Button
                  size="small"
                  disabled={methods.formState.isSubmitting}
                  onClick={() => {
                    methods.setValue('logo', null, { shouldDirty: true, shouldValidate: true });
                    methods.setValue('removeLogo', !logo, { shouldDirty: true });
                    setPreview(null);
                  }}
                >
                  {logo ? 'ยกเลิกรูปที่เลือก' : 'นำโลโก้ออก'}
                </Button>
              )}
            </Stack>
            <Typography
              variant="caption"
              color={methods.formState.errors.logo ? 'error' : 'text.secondary'}
            >
              {methods.formState.errors.logo?.message ?? 'JPG, PNG หรือ WebP ขนาดไม่เกิน 2 MB'}
            </Typography>
          </Stack>
        </Stack>
        {methods.formState.errors.root?.message && (
          <Alert severity="error">{methods.formState.errors.root.message}</Alert>
        )}
        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          <Button onClick={onCancel} disabled={methods.formState.isSubmitting}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="contained" loading={methods.formState.isSubmitting}>
            บันทึกข้อมูลร้าน
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}
