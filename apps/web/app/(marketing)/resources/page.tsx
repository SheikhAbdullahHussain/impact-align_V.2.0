import { SectionPage } from '@/components/marketing/section-page';
import { sectionMetadata } from '@/lib/section-metadata';

export const metadata = sectionMetadata('resources');

export default function Page() {
  return <SectionPage slug="resources" />;
}
