import type { StoreStatus } from 'src/types/store';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';

import { STORE_STATUS_LABEL } from 'src/types/store';

export type AdminStoreLocation = {
  id: string;
  name: string;
  address: string | null;
  province: string;
  district: string | null;
  subdistrict: string | null;
  latitude: number;
  longitude: number;
  current_status: StoreStatus;
  estimated_quantity: number | null;
  last_reported_at: string | null;
  is_active: boolean;
};

type AllLocationsPanelProps = {
  stores: AdminStoreLocation[];
};

const STATUS_COLOR: Record<StoreStatus, 'success' | 'warning' | 'error' | 'default'> = {
  available: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
  unknown: 'default',
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

export function AllLocationsPanel({ stores }: AllLocationsPanelProps) {
  const knownQuantityStores = stores.filter((store) => store.estimated_quantity !== null);
  const totalQuantity = knownQuantityStores.reduce(
    (total, store) => total + (store.estimated_quantity ?? 0),
    0
  );
  const lowOrEmptyCount = stores.filter(
    (store) => store.current_status === 'low_stock' || store.current_status === 'out_of_stock'
  ).length;

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 900 }}>
            พิกัด Loveza ทั้งหมด
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            จำนวนคงเหลือเป็นข้อมูลล่าสุดจากรายงานที่ Admin อนุมัติ
          </Typography>
        </Box>
        <Chip label={`${stores.length} จุด`} color="secondary" sx={{ alignSelf: 'flex-start' }} />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        <SummaryCard icon="ri:map-pin-2-fill" label="พิกัดทั้งหมด" value={`${stores.length} จุด`} />
        <SummaryCard
          icon="ri:drinks-2-fill"
          label={`ยอดคงเหลือจาก ${knownQuantityStores.length} จุด`}
          value={`${totalQuantity.toLocaleString('th-TH')} กระป๋อง`}
        />
        <SummaryCard
          icon="ri:alarm-warning-fill"
          label="เหลือน้อยหรือหมด"
          value={`${lowOrEmptyCount} จุด`}
        />
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
        <Table sx={{ minWidth: 860 }}>
          <TableHead>
            <TableRow>
              <TableCell>ร้าน / พิกัด</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="right">จำนวนคงเหลือ</TableCell>
              <TableCell>รายงานล่าสุด</TableCell>
              <TableCell align="right">แผนที่</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stores.map((store) => {
              const location = [store.address, store.subdistrict, store.district, store.province]
                .filter(Boolean)
                .join(', ');
              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;

              return (
                <TableRow key={store.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>{store.name}</Typography>
                        <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: 13 }}>
                          {location || `${store.latitude.toFixed(6)}, ${store.longitude.toFixed(6)}`}
                        </Typography>
                      </Box>
                      {!store.is_active ? <Chip size="small" label="ปิดใช้งาน" /> : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={STATUS_COLOR[store.current_status]}
                      label={STORE_STATUS_LABEL[store.current_status]}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 900 }}>
                      {store.estimated_quantity === null
                        ? 'ไม่ระบุ'
                        : `${store.estimated_quantity.toLocaleString('th-TH')} กระป๋อง`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {store.last_reported_at
                      ? new Date(store.last_reported_at).toLocaleString('th-TH')
                      : 'ยังไม่มีข้อมูล'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      variant="outlined"
                      startIcon={<Iconify icon="ri:map-pin-line" />}
                    >
                      เปิดแผนที่
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  ยังไม่มีพิกัดที่ได้รับการอนุมัติ
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
