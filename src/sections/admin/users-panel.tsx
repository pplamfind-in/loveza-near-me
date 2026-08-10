'use client';

import { useMemo, useState, useTransition } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { promoteUserToAdmin } from 'src/app/admin/users/actions';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

export type AdminUserActivity = {
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  total_reports: number;
  approved_reports: number;
  pending_reports: number;
  rejected_reports: number;
};

type UsersPanelProps = {
  users: AdminUserActivity[];
};

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            color: '#55296f',
            display: 'grid',
            borderRadius: 2,
            placeItems: 'center',
            bgcolor: 'rgba(85,41,111,.10)',
          }}
        >
          <Iconify icon={icon} width={26} />
        </Box>
        <Box>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{label}</Typography>
          <Typography sx={{ mt: 0.25, fontSize: 26, fontWeight: 900 }}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export function UsersPanel({ users }: UsersPanelProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<AdminUserActivity | null>(null);
  const [isPromoting, startPromoting] = useTransition();
  const usersWithReports = users.filter((user) => Number(user.total_reports) > 0).length;
  const totalReports = users.reduce((total, user) => total + Number(user.total_reports), 0);
  const paginatedUsers = useMemo(
    () => users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [page, rowsPerPage, users]
  );

  const handlePromote = () => {
    if (!selectedUser) return;

    startPromoting(async () => {
      const result = await promoteUserToAdmin(selectedUser.user_id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setSelectedUser(null);
    });
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
            ผู้ใช้งาน
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            บัญชี Google ที่เคยลงชื่อเข้าใช้และจำนวนพิกัดที่แต่ละคนแจ้ง
          </Typography>
        </Box>
        <Chip label={`${users.length} คน`} color="secondary" sx={{ alignSelf: 'flex-start' }} />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        <SummaryCard icon="ri:group-fill" label="ผู้ใช้งานทั้งหมด" value={`${users.length} คน`} />
        <SummaryCard
          icon="ri:user-heart-fill"
          label="ผู้ใช้ที่เคยแจ้งพิกัด"
          value={`${usersWithReports} คน`}
        />
        <SummaryCard
          icon="ri:map-pin-user-fill"
          label="รายงานพิกัดทั้งหมด"
          value={`${totalReports.toLocaleString('th-TH')} จุด`}
        />
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
        <Table sx={{ minWidth: 1080 }}>
          <TableHead>
            <TableRow>
              <TableCell>ผู้ใช้งาน</TableCell>
              <TableCell>เข้าสู่ระบบล่าสุด</TableCell>
              <TableCell>เริ่มใช้งาน</TableCell>
              <TableCell align="right">พิกัดที่แจ้ง</TableCell>
              <TableCell>สถานะรายงาน</TableCell>
              <TableCell align="right">จัดการสิทธิ์</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.user_id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={user.avatar_url || undefined}
                      alt={user.display_name}
                      imgProps={{ referrerPolicy: 'no-referrer' }}
                      sx={{ bgcolor: '#E5007E', fontWeight: 900 }}
                    >
                      {user.display_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ maxWidth: 230, fontWeight: 800 }}>
                        {user.display_name}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{ maxWidth: 230, color: 'text.secondary', fontSize: 13 }}
                      >
                        {user.email}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString('th-TH')
                    : 'ยังไม่มีข้อมูล'}
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString('th-TH')}</TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
                    {Number(user.total_reports).toLocaleString('th-TH')} จุด
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip size="small" color="success" label={`อนุมัติ ${user.approved_reports}`} />
                    <Chip size="small" color="warning" label={`รอตรวจ ${user.pending_reports}`} />
                    <Chip size="small" color="error" label={`ปฏิเสธ ${user.rejected_reports}`} />
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<Iconify icon="ri:shield-user-line" />}
                    onClick={() => setSelectedUser(user)}
                    sx={{ borderRadius: 99, whiteSpace: 'nowrap' }}
                  >
                    ตั้งเป็น Admin
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  ยังไม่มีผู้ใช้งานทั่วไปในระบบ
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          page={page}
          count={users.length}
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
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': {
              px: { xs: 1, sm: 2 },
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              justifyContent: { xs: 'center', sm: 'flex-end' },
            },
            '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
          }}
        />
      </TableContainer>

      <Dialog
        open={!!selectedUser}
        onClose={isPromoting ? undefined : () => setSelectedUser(null)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>ยืนยันการตั้งเป็น Admin</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
            ต้องการให้ <strong>{selectedUser?.display_name}</strong> เป็น Admin ใช่ไหม?
            ผู้ใช้นี้จะเข้าถึงและจัดการข้อมูลในหน้า Admin ได้ทั้งหมดหลังเข้าสู่ระบบครั้งถัดไป
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button color="inherit" disabled={isPromoting} onClick={() => setSelectedUser(null)}>
            ยังไม่ใช่
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={isPromoting}
            onClick={handlePromote}
            startIcon={
              isPromoting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon="ri:shield-check-line" />
              )
            }
          >
            {isPromoting ? 'กำลังเปลี่ยนสิทธิ์' : 'ยืนยันเป็น Admin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
