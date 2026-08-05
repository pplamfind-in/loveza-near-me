'use client';

import type { Report } from 'src/types/report';
import type { StockStatus } from 'src/types/store';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';

import { EmptyState } from 'src/components/common/empty-state';
import { ConfirmDialog } from 'src/components/common/confirm-dialog';

import { ApproveDialog } from './approve-dialog';
import { AdminReportItem } from './admin-report-item';
import { EditStoreDialog, type EditableStore } from './edit-store-dialog';
import {
  signOut,
  rejectReportAction,
  setStoreStatusAction,
  setStoreActiveAction,
} from './actions';

// ----------------------------------------------------------------------

type AdminDashboardProps = {
  pending: Report[];
  approved: Report[];
  rejected: Report[];
};

type ConfirmAction = { type: 'reject' | 'hide'; report: Report };

export function AdminDashboard({ pending, approved, rejected }: AdminDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [approveTarget, setApproveTarget] = useState<Report | null>(null);
  const [editTarget, setEditTarget] = useState<EditableStore | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null
  );

  const tabs = [
    { label: `รอตรวจสอบ (${pending.length})`, data: pending, variant: 'pending' as const },
    { label: `อนุมัติแล้ว (${approved.length})`, data: approved, variant: 'approved' as const },
    { label: `ปฏิเสธแล้ว (${rejected.length})`, data: rejected, variant: 'rejected' as const },
  ];

  const active = tabs[tab];

  async function handleConfirmAction() {
    if (!confirmAction) return;

    setConfirmLoading(true);

    try {
      if (confirmAction.type === 'reject') {
        await rejectReportAction(confirmAction.report.id);
      } else if (confirmAction.report.store_id) {
        await setStoreActiveAction(confirmAction.report.store_id, false);
      }
      setFeedback({ severity: 'success', message: 'บันทึกเรียบร้อยแล้ว' });
      router.refresh();
    } catch (error) {
      setFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'ดำเนินการไม่สำเร็จ',
      });
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  }

  async function handleChangeStatus(report: Report, status: StockStatus) {
    if (!report.store_id) return;

    setBusyId(report.id);

    try {
      await setStoreStatusAction(report.store_id, status);
      setFeedback({ severity: 'success', message: 'เปลี่ยนสถานะสินค้าแล้ว' });
      router.refresh();
    } catch (error) {
      setFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'เปลี่ยนสถานะไม่สำเร็จ',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="flex-end">
        <Button size="small" color="inherit" onClick={handleSignOut}>
          ออกจากระบบ
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(_event, value) => setTab(value)} variant="scrollable" scrollButtons="auto">
        {tabs.map((t) => (
          <Tab key={t.label} label={t.label} />
        ))}
      </Tabs>

      {active.data.length === 0 ? (
        <EmptyState title="ไม่มีรายการในหมวดนี้" />
      ) : (
        <Stack spacing={2}>
          {active.data.map((report) => (
            <AdminReportItem
              key={report.id}
              report={report}
              variant={active.variant}
              busy={busyId === report.id}
              onApprove={() => setApproveTarget(report)}
              onReject={() => setConfirmAction({ type: 'reject', report })}
              onHide={() => setConfirmAction({ type: 'hide', report })}
              onChangeStatus={(status) => handleChangeStatus(report, status)}
              onEdit={() =>
                report.store_id &&
                setEditTarget({
                  id: report.store_id,
                  name: report.store_name,
                  address: report.address,
                  province: report.province,
                  district: report.district,
                  subdistrict: report.subdistrict,
                  latitude: report.latitude,
                  longitude: report.longitude,
                })
              }
            />
          ))}
        </Stack>
      )}

      <ApproveDialog
        open={!!approveTarget}
        report={approveTarget}
        onClose={() => setApproveTarget(null)}
        onApproved={() => {
          setApproveTarget(null);
          setFeedback({ severity: 'success', message: 'อนุมัติรายงานแล้ว' });
          router.refresh();
        }}
      />

      <EditStoreDialog
        open={!!editTarget}
        store={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null);
          setFeedback({ severity: 'success', message: 'บันทึกข้อมูลร้านแล้ว' });
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === 'reject' ? 'ปฏิเสธรายงานนี้?' : 'ซ่อนร้านนี้?'}
        content={
          confirmAction?.type === 'reject'
            ? 'รายงานนี้จะถูกปฏิเสธและไม่แสดงผลต่อผู้ใช้งาน'
            : 'ร้านนี้จะถูกซ่อนจากการค้นหาและหน้าร้านใกล้ฉัน'
        }
        confirmLabel={confirmAction?.type === 'reject' ? 'ปฏิเสธ' : 'ซ่อนร้าน'}
        confirmColor="error"
        loading={confirmLoading}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : undefined}
      </Snackbar>
    </Stack>
  );
}
