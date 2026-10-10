import { LegalPlaceholder } from '@/components/marketing/legal-placeholder';
import { legalMetadata } from '@/lib/legal';

export const metadata = legalMetadata('security');

export default function Page() {
  return <LegalPlaceholder slug="security" />;
}
