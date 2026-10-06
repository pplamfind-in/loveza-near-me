'use client';

import { useState } from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

export function ForumCategoryFilter({
  category,
  categories,
}: {
  category: string;
  categories: readonly string[];
}) {
  const [value, setValue] = useState<string | null>(category || null);

  return (
    <>
      <input type="hidden" name="category" value={value ?? ''} />
      <Autocomplete
        options={categories}
        value={value}
        onChange={(_, nextValue) => setValue(nextValue)}
        size="small"
        noOptionsText="ไม่พบประเภทกระทู้"
        clearText="ทุกประเภท"
        openText="เลือกประเภทกระทู้"
        closeText="ปิดรายการ"
        sx={{ minWidth: { sm: 240 }, flexShrink: 0 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="ประเภทกระทู้"
            placeholder="ทุกประเภท"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        )}
      />
    </>
  );
}
