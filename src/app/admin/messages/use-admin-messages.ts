'use client';

import type { ContactMessage, ContactMessageStatus } from 'src/types/contact-message';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ADMIN_MESSAGES_QUERY_KEY = ['admin-contact-messages'] as const;
const MESSAGES_STALE_TIME = 2 * 60 * 1000;
const MESSAGES_GC_TIME = 30 * 60 * 1000;

async function fetchMessages(signal?: AbortSignal): Promise<ContactMessage[]> {
  const response = await fetch('/api/admin/messages/', { signal });
  const payload = (await response.json()) as { messages?: ContactMessage[]; error?: string };
  if (!response.ok) throw new Error(payload.error ?? 'โหลดข้อความไม่สำเร็จ');
  return payload.messages ?? [];
}

export function useAdminMessagesQuery() {
  return useQuery({
    queryKey: ADMIN_MESSAGES_QUERY_KEY,
    queryFn: ({ signal }) => fetchMessages(signal),
    staleTime: MESSAGES_STALE_TIME,
    gcTime: MESSAGES_GC_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateMessageStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactMessageStatus }) => {
      const response = await fetch(`/api/admin/messages/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as {
        message?: Pick<ContactMessage, 'id' | 'status' | 'updated_at' | 'resolved_at'>;
        error?: string;
      };
      if (!response.ok || !payload.message) {
        throw new Error(payload.error ?? 'อัปเดตข้อความไม่สำเร็จ');
      }
      return payload.message;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ContactMessage[]>(ADMIN_MESSAGES_QUERY_KEY, (current) =>
        current?.map((message) =>
          message.id === updated.id ? { ...message, ...updated } : message
        )
      );
    },
  });
}
