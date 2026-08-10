export type ContactMessageStatus = 'new' | 'read' | 'resolved';

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};
