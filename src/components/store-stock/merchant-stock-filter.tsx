import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';

import { FLAVOR_OPTIONS } from 'src/types/report';

const flavors = FLAVOR_OPTIONS.filter(({ value }) => value !== 'unknown');

type Props = {
  flavor: string;
  availableOnly: boolean;
  onChange: (flavor: string, availableOnly: boolean) => void;
};

export function MerchantStockFilter({ flavor, availableOnly, onChange }: Props) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ sm: 'center' }}>
      <Autocomplete
        size="small"
        options={flavors}
        value={flavors.find(({ value }) => value === flavor) ?? null}
        onChange={(_, option) => onChange(option?.value ?? '', option ? true : availableOnly)}
        getOptionLabel={({ label }) => label}
        renderInput={(params) => <TextField {...params} label="รสชาติ" placeholder="ทุกรส" />}
        sx={{ width: { xs: '100%', sm: 190 }, bgcolor: 'background.paper' }}
      />
      <FormControlLabel
        sx={{ m: 0 }}
        control={
          <Switch checked={availableOnly} onChange={(_, checked) => onChange(flavor, checked)} />
        }
        label="เฉพาะที่ร้านแจ้งว่ามีสินค้า"
      />
    </Stack>
  );
}
