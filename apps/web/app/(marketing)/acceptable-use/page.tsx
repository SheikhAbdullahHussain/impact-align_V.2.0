import { LegalPlaceholder } from '@/components/marketing/legal-placeholder';
import { legalMetadata } from '@/lib/legal';

export const metadata = legalMetadata('acceptable-use');

export default function Page() {
  return <LegalPlaceholder slug="acceptable-use" />;
}
