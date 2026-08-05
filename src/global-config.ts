export type ConfigValue = {
  appName: string;
  appShortName: string;
  supabase: { url: string; anonKey: string };
};

// ----------------------------------------------------------------------

export const CONFIG: ConfigValue = {
  appName: 'ตามหา Loveza',
  appShortName: 'Loveza Finder',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};
