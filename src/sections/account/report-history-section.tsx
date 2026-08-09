'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useAccountReportsQuery } from 'src/app/account/use-account-reports';

import { FLAVOR_OPTIONS } from 'src/types/report';
import { STORE_STATUS_LABEL } from 'src/types/store';

const statusLabels: Record<string, { label: string; color: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'รอตรวจสอบ', color: 'warning' },
  approved: { label: 'อนุมัติแล้ว', color: 'success' },
  rejected: { label: 'ไม่อนุมัติ', color: 'error' },
};

const flavorLabel = (value: string) =>
  FLAVOR_OPTIONS.find((option) => option.value === value)?.label ?? value;

export function ReportHistorySection() {
  const { data: reports = [], isLoading: loading, isError } = useAccountReportsQuery();
  const error = isError ? 'โหลดประวัติการแจ้งพิกัดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : '';

  const pendingCount = reports.filter((report) => report.approval_status === 'pending').length;
  const approvedCount = reports.filter((report) => report.approval_status === 'approved').length;

  return (
    <Box
      id="report-history"
      sx={{
        p: { xs: 2.5, md: 3.5 },
        minWidth: 0,
        border: '3px solid #351129',
        borderRadius: 4,
        bgcolor: '#fff',
        boxShadow: '7px 8px 0 #351129',
        scrollMarginTop: 100,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'flex-end' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography component="h2" sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 900 }}>
            ประวัติการแจ้งพิกัด
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            ติดตามสถานะข้อมูลที่คุณช่วยแจ้งให้ชุมชน Loveza
          </Typography>
        </Box>
        <Button
          href="/report"
          variant="contained"
          sx={{
            color: '#351129',
            border: '2px solid #351129',
            borderRadius: 99,
            backgroundImage: 'none',
            bgcolor: '#FDE047',
            boxShadow: '3px 4px 0 #351129',
          }}
        >
          + แจ้งพิกัดใหม่
        </Button>
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Box
            sx={{
              mt: 3,
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            }}
          >
            {[
              { label: 'ทั้งหมด', value: reports.length, color: '#6a40a5', bgcolor: '#f4effa' },
              { label: 'รอตรวจสอบ', value: pendingCount, color: '#b87500', bgcolor: '#fff6df' },
              { label: 'อนุมัติแล้ว', value: approvedCount, color: '#008c81', bgcolor: '#e8f8f5' },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  border: '2px solid #351129',
                  borderRadius: 2.5,
                  bgcolor: item.bgcolor,
                  boxShadow: '3px 3px 0 #351129',
                }}
              >
                <Typography
                  sx={{ color: item.color, fontSize: { xs: 24, sm: 30 }, fontWeight: 900 }}
                >
                  {item.value}
                </Typography>
                <Typography sx={{ color: item.color, fontSize: 12, fontWeight: 800 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Stack spacing={2} sx={{ mt: 3 }}>
            {reports.map((report) => {
              const status = statusLabels[report.approval_status] ?? statusLabels.pending;

              return (
                <Paper
                  key={report.id}
                  elevation={0}
                  sx={{ p: 2.5, border: '2px solid #351129', borderRadius: 3, bgcolor: '#FFF7FB' }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 19, fontWeight: 900 }}>
                        {report.store_name}
                      </Typography>
                      <Chip
                        size="small"
                        label={report.store_type_name || report.store_type}
                        sx={{ mt: 0.75, color: '#E5007E', fontWeight: 900, bgcolor: '#FFF0F8' }}
                      />
                      <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                        {[report.address, report.district, report.province]
                          .filter(Boolean)
                          .join(', ')}
                      </Typography>
                    </Box>
                    <Chip label={status.label} color={status.color} size="small" />
                  </Stack>
                  <Typography sx={{ mt: 2, fontWeight: 700 }}>
                    {STORE_STATUS_LABEL[report.stock_status as keyof typeof STORE_STATUS_LABEL] ??
                      report.stock_status}
                    {report.estimated_quantity !== null
                      ? ` · ประมาณ ${report.estimated_quantity} กระป๋อง`
                      : ''}
                    {report.flavors?.length
                      ? ` · ${report.flavors.map(flavorLabel).join(', ')}`
                      : ''}
                  </Typography>
                  <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 13 }}>
                    แจ้งเมื่อ {new Date(report.created_at).toLocaleString('th-TH')}
                  </Typography>
                </Paper>
              );
            })}

            {reports.length === 0 ? (
              <Paper elevation={0} sx={{ p: 5, borderRadius: 3, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 800 }}>ยังไม่มีประวัติการแจ้งพิกัด</Typography>
                <Typography sx={{ mt: 1, mb: 2, color: 'text.secondary' }}>
                  ถ้าพบ Loveza ที่ร้านไหน ช่วยบอกต่อเป็นคนแรกได้เลย
                </Typography>
              </Paper>
            ) : null}
          </Stack>
        </>
      )}
    </Box>
  );
}
