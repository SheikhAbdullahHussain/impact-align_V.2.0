import type { Metadata } from 'next';
import { EvidenceManager } from '@/components/dashboard/evidence-manager';

export const metadata: Metadata = { title: 'Project evidence' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EvidenceManager projectId={id} />;
}