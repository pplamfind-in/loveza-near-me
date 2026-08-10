import { z } from 'zod';

// ----------------------------------------------------------------------

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const LOCATION_REQUIRED_MESSAGE = 'กรุณากดใช้ตำแหน่งปัจจุบันก่อนส่งพิกัด';

// province/district come from an Autocomplete bound to the bundled 77-province
// dataset, so MUI needs `null` (not `''`) to represent "nothing picked yet" —
// the refine narrows that back down to a required string once one is chosen.
const requiredPick = (message: string) =>
  z
    .string()
    .nullable()
    .refine((value): value is string => !!value && value.trim().length > 0, message);

/**
 * Shared by the client form (react-hook-form + zodResolver) and the server
 * action, so validation rules only live in one place. `latitude`/`longitude`
 * arrive as real numbers from the form but as strings once round-tripped
 * through FormData into the server action — `coerce` handles both, and an
 * un-captured GPS reading (`undefined`) coerces to `NaN`, which the refine
 * below catches with a Thai message instead of zod's generic one.
 */
export const reportSchema = z.object({
  storeName: z.string().trim().min(2, 'กรุณาระบุชื่อร้าน').max(120),
  storeType: z
    .string()
    .trim()
    .min(2, 'กรุณาเลือกประเภทร้าน')
    .max(50)
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, 'ประเภทร้านไม่ถูกต้อง'),
  province: requiredPick('กรุณาเลือกจังหวัด'),
  district: requiredPick('กรุณาเลือกอำเภอ/เขต'),
  address: z.string().trim().max(300).optional(),
  latitude: z.coerce.number().refine((value) => !Number.isNaN(value), LOCATION_REQUIRED_MESSAGE),
  longitude: z.coerce.number().refine((value) => !Number.isNaN(value), LOCATION_REQUIRED_MESSAGE),
  stockStatus: z.enum(['available', 'low_stock', 'out_of_stock', 'unknown']),
  estimatedQuantity: z
    .union([z.literal(''), z.coerce.number().int().min(0, 'จำนวนต้องไม่ต่ำกว่า 0').max(9999)])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value)),
  flavors: z.array(z.enum(['honey_lemon', 'lychee', 'kyoho_grape', 'unknown'])).max(4),
  photo: z
    .instanceof(File)
    .nullable()
    .refine((file) => !file || file.size <= MAX_PHOTO_SIZE, 'ไฟล์รูปต้องไม่เกิน 5MB')
    .refine(
      (file) => !file || ALLOWED_PHOTO_TYPES.includes(file.type),
      'รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP'
    ),
  note: z.string().trim().max(500).optional(),
  storeId: z.string().uuid().optional(),
});

export type ReportFormValues = z.infer<typeof reportSchema>;

export type ReportDuplicateCandidate = {
  storeId: string;
  storeName: string;
  distanceM: number;
};

// Shared response shape between POST /api/reports and the client form.
export type ReportFormState =
  | { status: 'idle'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }
  | { status: 'duplicate'; message: string; candidate: ReportDuplicateCandidate };
