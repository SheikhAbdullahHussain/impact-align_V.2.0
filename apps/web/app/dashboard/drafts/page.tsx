import type { Metadata } from 'next';
import { ProjectStatusList } from '@/components/dashboard/project-status-list';

export const metadata: Metadata = { title: 'Drafts' };

export default function Page() {
  return <ProjectStatusList mode="drafts" />;
}