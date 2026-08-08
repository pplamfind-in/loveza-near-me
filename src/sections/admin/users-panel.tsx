import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

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
  const usersWithReports = users.filter((user) => Number(user.total_reports) > 0).length;
  const totalReports = users.reduce((total, user) => total + Number(user.total_reports), 0);

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
        <Table sx={{ minWidth: 940 }}>
          <TableHead>
            <TableRow>
              <TableCell>ผู้ใช้งาน</TableCell>
              <TableCell>เข้าสู่ระบบล่าสุด</TableCell>
              <TableCell>เริ่มใช้งาน</TableCell>
              <TableCell align="right">พิกัดที่แจ้ง</TableCell>
              <TableCell>สถานะรายงาน</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={user.avatar_url || undefined}
                      alt={user.display_name}
                      imgProps={{ referrerPolicy: 'no-referrer' }}
                      sx={{ bgcolor: '#ef2382', fontWeight: 900 }}
                    >
                      {user.display_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ maxWidth: 230, fontWeight: 800 }}>
                        {user.display_name}
                      </Typography>
                      <Typography noWrap sx={{ maxWidth: 230, color: 'text.secondary', fontSize: 13 }}>
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
              </TableRow>
            ))}

            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  ยังไม่มีผู้ใช้งานทั่วไปในระบบ
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
