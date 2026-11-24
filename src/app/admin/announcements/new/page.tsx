import { AnnouncementForm } from '../announcement-form';

export default function NewAnnouncementPage() {
  return (
    <AnnouncementForm
      values={{ title: '', content: '', publicationMode: 'immediate', publishDate: '' }}
    />
  );
}
