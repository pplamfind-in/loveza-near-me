'use client';

import type { Store } from 'src/types/store';
import type { Report } from 'src/types/report';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { searchStoresAction, approveReportAction } from './actions';

// ----------------------------------------------------------------------

type ApproveDialogProps = {
  open: boolean;
  report: Report | null;
  onClose: () => void;
  onApproved: () => void;
};

export function ApproveDialog({ open, report, onClose, onApproved }: ApproveDialogProps) {
  const [keyword, setKeyword] = useState('');
  const [options, setOptions] = useState<Store[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setKeyword('');
      setOptions([]);
      setSelectedStore(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!keyword.trim()) {
      setOptions([]);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(async () => {
      const results = await searchStoresAction(keyword);
      if (!cancelled) {
        setOptions(results);
        setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [keyword]);

  async function handleConfirm() {
    if (!report) return;

    setLoading(true);
    setError(null);

    try {
      await approveReportAction(report, selectedStore?.id);
      onApproved();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'อนุมัติไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>อนุมัติรายงาน</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {report?.store_name} — {report?.province}
          </Typography>

          <Autocomplete
            options={options}
            loading={searching}
            filterOptions={(x) => x}
            getOptionLabel={(option) => option.name}
            value={selectedStore}
            onChange={(_event, value) => setSelectedStore(value)}
            onInputChange={(_event, value) => setKeyword(value)}
            noOptionsText="ไม่พบร้านที่ตรงกัน"
            renderInput={(params) => (
              <TextField
                {...params}
                label="รวมเข้ากับร้านเดิม (ไม่บังคับ)"
                placeholder="ค้นหาชื่อร้าน"
              />
            )}
          />

          <Typography variant="caption" color="text.secondary">
            หากไม่เลือกร้าน ระบบจะสร้างร้านใหม่จากข้อมูลที่แจ้งมา
          </Typography>

          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          ยกเลิก
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="success" loading={loading}>
          อนุมัติ
        </Button>
      </DialogActions>
    </Dialog>
  );
}
