import { LegalPlaceholder } from '@/components/marketing/legal-placeholder';
import { legalMetadata } from '@/lib/legal';

export const metadata = legalMetadata('terms');

export default function Page() {
  return <LegalPlaceholder slug="terms" />;
}
