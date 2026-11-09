import type { Metadata } from 'next';
import { AssessmentsHome } from '@/components/dashboard/assessments-home';

export const metadata: Metadata = { title: 'My Assessments' };

export default function Page() {
  return <AssessmentsHome />;
}