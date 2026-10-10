import { LegalPlaceholder } from '@/components/marketing/legal-placeholder';
import { legalMetadata } from '@/lib/legal';

export const metadata = legalMetadata('ai-ethics');

export default function Page() {
  return <LegalPlaceholder slug="ai-ethics" />;
}
