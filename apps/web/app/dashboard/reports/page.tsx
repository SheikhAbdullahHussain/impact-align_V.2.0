import { ReportsList } from '@/components/dashboard/reports-list';
import { dashboardMetadata } from '@/lib/dashboard-content';

export const metadata = dashboardMetadata('/dashboard/reports');

export default function Page() {
  return <ReportsList />;
}
