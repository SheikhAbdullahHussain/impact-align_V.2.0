import type { Metadata } from 'next';
import { AssessmentDetail } from '@/components/dashboard/assessment-detail';

export const metadata: Metadata = { title: 'Assessment' };

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <AssessmentDetail projectId={projectId} />;
}