import type { Metadata } from 'next';
import { ProjectsManager } from '@/components/dashboard/projects-manager';

export const metadata: Metadata = { title: 'Projects' };

export default function Page() {
  return <ProjectsManager />;
}