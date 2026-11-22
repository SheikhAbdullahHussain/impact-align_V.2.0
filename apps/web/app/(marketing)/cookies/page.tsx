import { LegalPage } from '@/components/marketing/legal-page';
import { legalMetadata } from '@/lib/legal';

export const metadata = legalMetadata('cookies');

export default function Page() {
  return <LegalPage slug="cookies" />;
}
