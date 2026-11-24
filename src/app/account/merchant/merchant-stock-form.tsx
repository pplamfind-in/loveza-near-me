'use client';

import type { MerchantStock } from './stock-schema';
import type { MerchantFlavorStock } from 'src/types/store';

import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { reportSubmitButtonSx } from 'src/app/report/form-section';

import { Form, Field } from 'src/components/hook-form';

import { STORE_STATUS_LABEL } from 'src/types/store';
import { getReportedFlavorLabels } from 'src/types/report';

import { updateMerchantStock } from './actions';
import { merchantStockSchema, merchantFlavorOptions } from './stock-schema';

type Props = {
  storeId: string;
  filters: { q: string; page: number };
  stock: MerchantFlavorStock;
};

export function MerchantStockForm(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        size="large"
        onClick={() => setOpen(true)}
        sx={{ ...reportSubmitButtonSx, alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
      >
        อัปเดตสต็อก
      </Button>
      {open && <StockDialog {...props} onClose={() => setOpen(false)} />}
    </>
  );
}

function StockDialog({ storeId, filters, stock, onClose }: Props & { onClose: () => void }) {
  const titleId = useId();
  const methods = useForm<MerchantStock>({
    defaultValues: { flavor: null, status: 'unknown', quantity: '' },
    resolver: zodResolver(merchantStockSchema),
  });
  const { isSubmitting, errors } = methods.formState;
  const submit = methods.handleSubmit(async (values) => {
    methods.clearErrors('root');
    const error = await updateMerchantStock(storeId, filters, values);
    if (error) methods.setError('root', { message: error });
  });

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
      onClose={isSubmitting ? undefined : onClose}
    >
      <DialogTitle id={titleId}>อัปเดตสต็อกตามรสชาติ</DialogTitle>
      <Form methods={methods} onSubmit={submit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Field.Autocomplete
              name="flavor"
              label="รสชาติ"
              options={merchantFlavorOptions}
              getOptionLabel={(value: NonNullable<MerchantStock['flavor']>) =>
                getReportedFlavorLabels([value])[0] ?? value
              }
              disabled={isSubmitting}
              onChange={(_, flavor: MerchantStock['flavor']) => {
                const saved = flavor ? stock[flavor] : undefined;
                methods.setValue('flavor', flavor, { shouldDirty: true, shouldValidate: true });
                methods.setValue('status', saved?.status ?? 'unknown');
                methods.setValue('quantity', saved?.quantity?.toString() ?? '');
              }}
            />
            <Field.Autocomplete
              name="status"
              label="สถานะของรสนี้"
              options={merchantStockSchema.shape.status.options}
              getOptionLabel={(option: MerchantStock['status']) => STORE_STATUS_LABEL[option]}
              disableClearable
              disabled={isSubmitting}
            />
            <Field.Text
              name="quantity"
              label="จำนวนคงเหลือของรสนี้ (กระป๋อง)"
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              disabled={isSubmitting}
            />
            {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            บันทึกสต็อก
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
