import { CertificatesList } from '@/components/dashboard/certificates-list';
import { dashboardMetadata } from '@/lib/dashboard-content';

export const metadata = dashboardMetadata('/dashboard/certificates');

export default function Page() {
  return <CertificatesList />;
}
