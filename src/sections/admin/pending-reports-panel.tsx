'use client';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { useAdminReportsQuery, useReportDecisionMutation } from 'src/app/admin/use-admin-reports';

import { FLAVOR_OPTIONS } from 'src/types/report';
import { STORE_STATUS_LABEL } from 'src/types/store';

const flavorLabel = (value: string) => FLAVOR_OPTIONS.find((option) => option.value === value)?.label ?? value;

export function PendingReportsPanel() {
  const { data: reports = [], isLoading: loading, isError } = useAdminReportsQuery();
  const approveMutation = useReportDecisionMutation('approve');
  const rejectMutation = useReportDecisionMutation('reject');
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const maxPage = Math.max(0, Math.ceil(reports.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const paginatedReports = useMemo(
    () => reports.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage),
    [currentPage, reports, rowsPerPage]
  );

  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [maxPage, page]);

  const pendingRowId = approveMutation.isPending
    ? approveMutation.variables
    : rejectMutation.isPending
      ? rejectMutation.variables
      : null;

  const handleDecision = (id: string, decision: 'approve' | 'reject') => {
    if (pendingRowId) return;

    setRowError(null);
    const mutation = decision === 'approve' ? approveMutation : rejectMutation;
    mutation.mutate(id, {
      onError: () => setRowError({ id, message: 'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง' }),
    });
  };

  return (
    <Stack spacing={2}>
      <Stack
        id="pending-reports"
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ scrollMarginTop: 24 }}
      >
        <Typography component="h1" sx={{ fontSize: 30, fontWeight: 900 }}>
          ข้อมูลรอตรวจสอบ
        </Typography>
        <Chip label={`${reports.length} รายการ`} color="secondary" />
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Alert severity="error">โหลดข้อมูลรอตรวจสอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Alert>
      ) : (
        <>
          {paginatedReports.map((report) => {
            const profile = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;
            const isRowPending = pendingRowId === report.id;

            return (
              <Paper key={report.id} elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={3}>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{report.store_name}</Typography>
                    <Chip
                      size="small"
                      label={report.store_type_name || report.store_type}
                      sx={{ mt: 0.75, fontWeight: 900, bgcolor: '#FFF0F8', color: '#E5007E' }}
                    />
                    <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {[report.address, report.district, report.province].filter(Boolean).join(', ')}
                    </Typography>
                    <Typography sx={{ mt: 1.5, fontWeight: 700 }}>
                      สต็อก:{' '}
                      {STORE_STATUS_LABEL[report.stock_status as keyof typeof STORE_STATUS_LABEL] ??
                        report.stock_status}
                      {report.estimated_quantity !== null ? ` · ${report.estimated_quantity} กระป๋อง` : ''}
                      {report.flavors?.length ? ` · ${report.flavors.map(flavorLabel).join(', ')}` : ''}
                    </Typography>
                    {report.note ? <Typography sx={{ mt: 1 }}>หมายเหตุ: {report.note}</Typography> : null}
                    {report.photo_url ? (
                      <Box
                        component="img"
                        src={report.photo_url}
                        alt={report.store_name}
                        sx={{ mt: 1.5, width: 96, height: 96, borderRadius: 2, objectFit: 'cover' }}
                      />
                    ) : null}
                    <Divider sx={{ my: 1.5 }} />
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      ผู้แจ้ง: {profile?.display_name || 'ไม่ระบุ'} ({profile?.email || 'ไม่มีอีเมล'}) ·{' '}
                      {new Date(report.created_at).toLocaleString('th-TH')}
                    </Typography>
                    {rowError?.id === report.id ? (
                      <Alert severity="error" sx={{ mt: 1.5 }}>
                        {rowError.message}
                      </Alert>
                    ) : null}
                  </Box>
                  <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} sx={{ minWidth: 140 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      disabled={isRowPending}
                      onClick={() => handleDecision(report.id, 'approve')}
                    >
                      {isRowPending ? <CircularProgress size={20} color="inherit" /> : 'อนุมัติ'}
                    </Button>
                    <Button
                      color="error"
                      fullWidth
                      disabled={isRowPending}
                      onClick={() => handleDecision(report.id, 'reject')}
                    >
                      ปฏิเสธ
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
          {reports.length === 0 ? (
            <Paper elevation={0} sx={{ p: 5, borderRadius: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">ไม่มีข้อมูลรอตรวจสอบ</Typography>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <TablePagination
                component="div"
                page={currentPage}
                count={reports.length}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(0);
                }}
                labelRowsPerPage="แสดงต่อหน้า"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} จาก ${count !== -1 ? count.toLocaleString('th-TH') : `มากกว่า ${to}`}`
                }
                getItemAriaLabel={(type) => {
                  if (type === 'first') return 'ไปหน้าแรก';
                  if (type === 'last') return 'ไปหน้าสุดท้าย';
                  if (type === 'next') return 'ไปหน้าถัดไป';
                  return 'ไปหน้าก่อนหน้า';
                }}
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiTablePagination-toolbar': {
                    px: { xs: 1, sm: 2 },
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    justifyContent: { xs: 'center', sm: 'flex-end' },
                  },
                  '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
                }}
              />
            </Paper>
          )}
        </>
      )}
    </Stack>
  );
}
