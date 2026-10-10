import { SectionPage } from '@/components/marketing/section-page';
import { sectionMetadata } from '@/lib/section-metadata';

export const metadata = sectionMetadata('how-it-works');

export default function Page() {
  return <SectionPage slug="how-it-works" />;
}
