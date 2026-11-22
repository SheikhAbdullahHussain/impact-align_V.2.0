import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { faqGroups } from '../apps/web/lib/faq-content';
import { sections } from '../apps/web/lib/section-content';

const out = path.resolve(__dirname, '../apps/admin/public/builtin');
mkdirSync(out, { recursive: true });

const write = (name: string, data: unknown) => {
  writeFileSync(path.join(out, `${name}.json`), JSON.stringify(data, null, 2), 'utf8');
  console.log(`wrote ${name}.json`);
};

write('faq-accreditation', { groups: faqGroups });

const EDITABLE = [
  'about',
  'how-it-works',
  'platform',
  'resources',
  'community',
  'join-impactalign',
];
for (const section of sections.filter((s) => EDITABLE.includes(s.slug))) {
  write(`section-${section.slug}`, {
    title: section.title,
    eyebrow: section.eyebrow,
    intro: section.intro,
    topics: section.topics.map((topic) => ({
      title: topic.title,
      description: topic.description,
      body: [...(topic.body ?? [])],
    })),
  });
}
