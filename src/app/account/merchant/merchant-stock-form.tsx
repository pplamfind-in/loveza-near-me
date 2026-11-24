'use client';

import type { MerchantStock } from './stock-schema';
import type { MerchantFlavorStock } from 'src/types/store';

import { useId, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

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
  const flavorOptions = [...merchantFlavorOptions].sort(
    (a, b) => Number(Boolean(stock[b])) - Number(Boolean(stock[a]))
  );
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
              options={flavorOptions}
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
            <Controller
              name="status"
              control={methods.control}
              render={({ field }) => (
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2">สถานะของรสนี้</Typography>
                  <ToggleButtonGroup
                    value={field.value}
                    onChange={(_, status: MerchantStock['status'] | null) => {
                      if (!status) return;
                      field.onChange(status);
                      if (status === 'out_of_stock') methods.setValue('quantity', '0');
                      else if (field.value === 'out_of_stock') methods.setValue('quantity', '');
                    }}
                    aria-label="สถานะของรสนี้"
                    exclusive
                    size="small"
                    disabled={isSubmitting}
                    sx={{ flexWrap: 'wrap' }}
                  >
                    {merchantStockSchema.shape.status.options.map((status) => (
                      <ToggleButton key={status} value={status} color={status === 'unknown' ? 'standard' : 'primary'}>
                        {STORE_STATUS_LABEL[status]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Stack>
              )}
            />
            <Field.Text
              name="quantity"
              label="จำนวนคงเหลือ (กระป๋อง, ไม่บังคับ)"
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
