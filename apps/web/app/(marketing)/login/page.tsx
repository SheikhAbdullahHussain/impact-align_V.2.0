import { SectionPage } from '@/components/marketing/section-page';
import { sectionMetadata } from '@/lib/section-metadata';

export const metadata = sectionMetadata('login');

export default function Page() {
  return <SectionPage slug="login" />;
}
