import { z } from 'zod';
import { cookies } from 'next/headers';

export const GUEST_VOTER_COOKIE = 'loveza-guest-voter';

export async function getGuestVoterId() {
  const result = z.uuid().safeParse((await cookies()).get(GUEST_VOTER_COOKIE)?.value);
  return result.success ? result.data : null;
}
