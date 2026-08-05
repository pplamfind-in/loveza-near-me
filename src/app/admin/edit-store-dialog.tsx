'use client';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { THAI_PROVINCES } from 'src/data/thai-provinces';

import { updateStoreAction } from './actions';

// ----------------------------------------------------------------------

export type EditableStore = {
  id: string;
  name: string;
  address: string | null;
  province: string;
  district: string | null;
  subdistrict: string | null;
  latitude: number;
  longitude: number;
};

type EditStoreDialogProps = {
  open: boolean;
  store: EditableStore | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditStoreDialog({ open, store, onClose, onSaved }: EditStoreDialogProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      setName(store.name);
      setAddress(store.address ?? '');
      setProvince(store.province);
      setDistrict(store.district ?? '');
      setSubdistrict(store.subdistrict ?? '');
      setLatitude(String(store.latitude));
      setLongitude(String(store.longitude));
      setError(null);
    }
  }, [store]);

  async function handleSave() {
    if (!store) return;

    setLoading(true);
    setError(null);

    try {
      await updateStoreAction(store.id, {
        name,
        address: address || null,
        province,
        district: district || null,
        subdistrict: subdistrict || null,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>แก้ไขข้อมูลร้าน</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="ชื่อร้าน"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
          />
          <TextField
            label="ที่อยู่"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            fullWidth
          />
          <TextField
            select
            label="จังหวัด"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            fullWidth
          >
            {THAI_PROVINCES.map((item) => (
              <MenuItem key={item.code} value={item.name}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField
              label="อำเภอ"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              fullWidth
            />
            <TextField
              label="ตำบล"
              value={subdistrict}
              onChange={(event) => setSubdistrict(event.target.value)}
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Latitude"
              type="number"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              slotProps={{ htmlInput: { step: 'any' } }}
              fullWidth
            />
            <TextField
              label="Longitude"
              type="number"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              slotProps={{ htmlInput: { step: 'any' } }}
              fullWidth
            />
          </Stack>
          {error && <Stack sx={{ color: 'error.main', typography: 'caption' }}>{error}</Stack>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          ยกเลิก
        </Button>
        <Button onClick={handleSave} variant="contained" loading={loading}>
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
