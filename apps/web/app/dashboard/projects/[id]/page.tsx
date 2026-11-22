import type { Metadata } from 'next';
import { SubmissionWizard } from '@/components/submission/submission-wizard';

export const metadata: Metadata = { title: 'Submission' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubmissionWizard projectId={id} />;
}
