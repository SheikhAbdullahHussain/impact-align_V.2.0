import { AccreditationPanel } from '@/components/dashboard/accreditation-panel';
import { dashboardMetadata } from '@/lib/dashboard-content';

export const metadata = dashboardMetadata('/dashboard/accreditation');

export default function Page() {
  return <AccreditationPanel />;
}
