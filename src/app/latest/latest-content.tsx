'use client';

import type { Report } from 'src/types/report';
import type { StockStatus } from 'src/types/store';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { createClient } from 'src/lib/supabase/client';
import { THAI_PROVINCES } from 'src/data/thai-provinces';
import { STOCK_STATUS_OPTIONS } from 'src/validations/report.schema';
import { getLatestApprovedReports } from 'src/services/reports.service';

import { ReportCard } from 'src/components/store/report-card';
import { EmptyState } from 'src/components/common/empty-state';
import { ErrorState } from 'src/components/common/error-state';
import { LoadingState } from 'src/components/common/loading-state';

// ----------------------------------------------------------------------

export function LatestContent() {
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus | ''>('');
  const [flavor, setFlavor] = useState('');

  const [reports, setReports] = useState<Report[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const data = await getLatestApprovedReports(supabase, {
          province: province || undefined,
          district: district || undefined,
          stockStatus: stockStatus || undefined,
          flavor: flavor || undefined,
        });

        if (!cancelled) setReports(data);
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'โหลดข้อมูลไม่สำเร็จ');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const timer = setTimeout(load, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [province, district, stockStatus, flavor, reloadKey]);

  return (
    <Stack spacing={2.5}>
      <Stack spacing={1.5}>
        <TextField
          select
          label="จังหวัด"
          value={province}
          onChange={(event) => setProvince(event.target.value)}
          fullWidth
        >
          <MenuItem value="">ทั้งหมด</MenuItem>
          {THAI_PROVINCES.map((item) => (
            <MenuItem key={item.code} value={item.name}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction="row" spacing={1.5}>
          <TextField
            label="อำเภอ"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            fullWidth
          />
          <TextField
            label="รสชาติ"
            value={flavor}
            onChange={(event) => setFlavor(event.target.value)}
            fullWidth
          />
        </Stack>

        <TextField
          select
          label="สถานะสินค้า"
          value={stockStatus}
          onChange={(event) => setStockStatus(event.target.value as StockStatus | '')}
          fullWidth
        >
          <MenuItem value="">ทั้งหมด</MenuItem>
          {STOCK_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {isLoading && <LoadingState rows={4} />}

      {!isLoading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {!isLoading && !error && reports && reports.length === 0 && (
        <EmptyState
          title="ยังไม่พบพิกัด Loveza ในพื้นที่นี้"
          description="ถ้าคุณเจอ สามารถช่วยแจ้งพิกัดให้คนอื่นได้"
          actionLabel="แจ้งพิกัดแรก"
          actionHref="/report"
        />
      )}

      {!isLoading && !error && reports && reports.length > 0 && (
        <Stack spacing={2}>
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
