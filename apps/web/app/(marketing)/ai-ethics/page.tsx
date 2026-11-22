import { LegalPage } from '@/components/marketing/legal-page';
import { legalMetadata } from '@/lib/legal';

export const metadata = legalMetadata('ai-ethics');

export default function Page() {
  return <LegalPage slug="ai-ethics" />;
}
