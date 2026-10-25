import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { dashboardMetadata } from '@/lib/dashboard-content';

export const metadata = dashboardMetadata('/dashboard/subscription');

export default function Page() {
  return <DashboardPage href="/dashboard/subscription" />;
}
