type DisplayNameUser = { user_metadata?: Record<string, unknown>; email?: string };

export function getUserDisplayName(user: DisplayNameUser, fallback = 'สมาชิก Loveza') {
  for (const value of [
    user.user_metadata?.display_name,
    user.user_metadata?.full_name,
    user.user_metadata?.name,
  ]) {
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 100);
  }
  return fallback;
}
