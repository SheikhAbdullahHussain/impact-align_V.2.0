'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CONTENT_KEYS,
  CONTENT_KINDS,
  type ContentKind,
  type ContentListItemDto,
} from '@impactalign/types';
import { Badge, Card } from '@impactalign/ui';
import { adminSiteContentApi, authApi, describeError } from '@impactalign/api-client';

const KIND_TITLES: Record<ContentKind, string> = {
  FAQ: 'FAQ',
  SECTION: 'Section pages',
  LEGAL: 'Legal pages',
  PLANS: 'Membership and subscription',
};

export function ContentList() {
  const [items, setItems] = useState<ContentListItemDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me();
        const result = await adminSiteContentApi.list();
        if (active) setItems(result.items);
      } catch (cause) {
        if (active) {
          setError(describeError(cause));
          setItems([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const statusOf = (kind: ContentKind, key: string) =>
    items?.find((i) => i.kind === kind && i.key === key)?.status ?? null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold text-navy-900">Website content</h1>
        <p className="mt-2 text-navy-800">
          Published content replaces the built-in text on the website. Pages that are not published
          keep showing the built-in text.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-700 bg-red-50 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}
      {items === null && <p role="status">Loading...</p>}

      {items !== null &&
        CONTENT_KINDS.map((kind) => (
          <section key={kind}>
            <h2 className="font-serif text-xl font-bold text-navy-900">{KIND_TITLES[kind]}</h2>
            <ul className="mt-3 space-y-2">
              {CONTENT_KEYS[kind].map((entry) => {
                const status = statusOf(kind, entry.key);
                return (
                  <li key={entry.key}>
                    <Card className="flex flex-wrap items-center justify-between gap-3">
                      <Link
                        href={`/console/content/${kind.toLowerCase()}/${entry.key}`}
                        className="font-semibold text-navy-900 underline underline-offset-4"
                      >
                        {entry.label}
                      </Link>
                      <Badge
                        tone={
                          status === 'PUBLISHED' ? 'teal' : status === 'DRAFT' ? 'gold' : 'neutral'
                        }
                      >
                        {status === 'PUBLISHED'
                          ? 'Published'
                          : status === 'DRAFT'
                            ? 'Draft'
                            : 'Built-in text'}
                      </Badge>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </div>
  );
}
