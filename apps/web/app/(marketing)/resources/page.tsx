import { LiveSectionPage } from '@/components/marketing/section-page-live';
import { sectionMetadata } from '@/lib/section-metadata';

export const metadata = sectionMetadata('resources');

export default function Page() {
  return <LiveSectionPage slug="resources" />;
}
