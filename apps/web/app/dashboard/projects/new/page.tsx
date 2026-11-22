import type { Metadata } from 'next';
import { SubmissionWizard } from '@/components/submission/submission-wizard';

export const metadata: Metadata = { title: 'New submission' };

export default function Page() {
  return <SubmissionWizard />;
}
