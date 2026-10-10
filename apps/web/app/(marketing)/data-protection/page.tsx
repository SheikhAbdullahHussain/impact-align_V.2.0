import { LegalPlaceholder } from '@/components/marketing/legal-placeholder';
import { legalMetadata } from '@/lib/legal';

export const metadata = legalMetadata('data-protection');

export default function Page() {
  return <LegalPlaceholder slug="data-protection" />;
}
