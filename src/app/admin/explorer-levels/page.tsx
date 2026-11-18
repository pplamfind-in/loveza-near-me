import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { DashboardContent } from 'src/layouts/dashboard';
import { EXPLORER_LEVELS, POINTS_PER_STORE } from 'src/lib/explorer/progress';

export const metadata = { title: 'เลเวลนักสำรวจ | Loveza Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <Typography component="h1" variant="h4">
        เงื่อนไขเลเวลนักสำรวจ
      </Typography>
      <Typography sx={{ mt: 1, mb: 3, color: 'text.secondary' }}>
        เลเวล 1–100 · ร้านไม่ซ้ำที่ผ่านอนุมัติรับ {POINTS_PER_STORE} แต้มต่อร้าน
      </Typography>
      <Card>
        <TableContainer sx={{ maxHeight: 'min(70dvh, 760px)' }}>
          <Table
            stickyHeader
            size="small"
            aria-label="เงื่อนไขเลเวลนักสำรวจทั้ง 100 เลเวล"
            sx={{ minWidth: 660 }}
          >
            <TableHead>
              <TableRow>
                <TableCell>เลเวล</TableCell>
                <TableCell align="right">ร้านเพิ่มจากเลเวลก่อน</TableCell>
                <TableCell align="right">ร้านสะสมขั้นต่ำ</TableCell>
                <TableCell align="right">แต้มสะสมขั้นต่ำ</TableCell>
                <TableCell>ฉายา</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {EXPLORER_LEVELS.map(
                ({ level, name, titleUnlock, totalStores, storesToAdvance, points }) => (
                  <TableRow key={level} hover selected={Boolean(titleUnlock)}>
                    <TableCell component="th" scope="row">
                      {level}
                    </TableCell>
                    <TableCell align="right">{storesToAdvance || 'เริ่มต้น'}</TableCell>
                    <TableCell align="right">{totalStores.toLocaleString('th-TH')}</TableCell>
                    <TableCell align="right">{points.toLocaleString('th-TH')}</TableCell>
                    <TableCell>
                      {titleUnlock ? <Chip size="small" color="success" label={name} /> : name}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </DashboardContent>
  );
}
