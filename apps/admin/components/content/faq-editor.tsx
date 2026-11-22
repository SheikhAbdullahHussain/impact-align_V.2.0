'use client';

import { useEffect, useState } from 'react';
import type { ContentStatus, FaqContentDto } from '@impactalign/types';
import { Button, Card } from '@impactalign/ui';
import { adminSiteContentApi, authApi } from '@impactalign/api-client';
import { loadBuiltin } from '../../lib/builtin';
import { blocksToText, textToBlocks } from '../../lib/content-text';
import { reason } from '../../lib/errors';
import { EditorShell } from './editor-shell';

interface ItemState {
  number: number;
  question: string;
  answer: string;
}
interface GroupState {
  id: string;
  title: string;
  items: ItemState[];
}

const fromDto = (data: FaqContentDto): GroupState[] =>
  data.groups.map((g) => ({
    id: g.id,
    title: g.title,
    items: g.items.map((i) => ({
      number: i.number,
      question: i.question,
      answer: blocksToText(i.answer),
    })),
  }));

const toDto = (groups: GroupState[]): FaqContentDto => ({
  groups: groups.map((g) => ({
    id: g.id.trim(),
    title: g.title.trim(),
    items: g.items.map((i) => ({
      number: i.number,
      question: i.question.trim(),
      answer: textToBlocks(i.answer),
    })),
  })),
});

const nextNumber = (groups: GroupState[]) =>
  Math.max(0, ...groups.flatMap((g) => g.items.map((i) => i.number))) + 1;

const field = 'mt-1 w-full rounded-md border border-navy-700 p-2';

export function FaqEditor({
  contentKey,
  label,
}: {
  readonly contentKey: string;
  readonly label: string;
}) {
  const [groups, setGroups] = useState<GroupState[]>([]);
  const [status, setStatus] = useState<ContentStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.me();
        const { entry } = await adminSiteContentApi.get('faq', contentKey);
        if (!active) return;
        if (entry) {
          setGroups(fromDto(entry.data as FaqContentDto));
          setStatus(entry.status);
        }
      } catch (cause) {
        if (active) setError(reason(cause));
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [contentKey]);

  const update = (gi: number, patch: Partial<GroupState>) =>
    setGroups((all) => all.map((g, index) => (index === gi ? { ...g, ...patch } : g)));
  const updateItem = (gi: number, ii: number, patch: Partial<ItemState>) =>
    setGroups((all) =>
      all.map((g, index) =>
        index === gi
          ? { ...g, items: g.items.map((i, n) => (n === ii ? { ...i, ...patch } : i)) }
          : g,
      ),
    );

  async function importBuiltin() {
    setError(null);
    try {
      setGroups(fromDto(await loadBuiltin<FaqContentDto>(`faq-${contentKey}`)));
      setMessage('Built-in text loaded. Review it, then save a draft or publish.');
    } catch {
      setError('Built-in text file not found. Run: npx tsx scripts/export-builtin-content.ts');
    }
  }

  async function save(next: ContentStatus) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { entry } = await adminSiteContentApi.save('faq', contentKey, {
        status: next,
        data: toDto(groups),
      });
      setStatus(entry.status);
      setMessage(
        next === 'PUBLISHED' ? 'Published. The website now shows this FAQ.' : 'Draft saved.',
      );
    } catch (cause) {
      setError(reason(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <EditorShell
      label={label}
      status={status}
      loaded={loaded}
      busy={busy}
      error={error}
      message={message}
      onSave={save}
      extraActions={
        <Button variant="outline" onClick={importBuiltin} disabled={busy}>
          Load built-in text
        </Button>
      }
    >
      <p className="text-sm text-navy-700">
        Answers are plain text. Leave a blank line between paragraphs. Start each line with - to
        make a bullet list.
      </p>
      {groups.map((group, gi) => (
        <Card key={gi} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block font-semibold text-navy-900">
              Group id (a-z, 0-9, dashes)
              <input
                aria-label={`Group ${gi + 1} id`}
                value={group.id}
                onChange={(e) => update(gi, { id: e.target.value })}
                className={field}
              />
            </label>
            <label className="block font-semibold text-navy-900">
              Group title
              <input
                aria-label={`Group ${gi + 1} title`}
                value={group.title}
                onChange={(e) => update(gi, { title: e.target.value })}
                className={field}
              />
            </label>
          </div>

          {group.items.map((item, ii) => (
            <div key={ii} className="space-y-2 rounded-md border border-navy-100 p-3">
              <div className="flex gap-3">
                <input
                  type="number"
                  aria-label={`Group ${gi + 1} question ${ii + 1} number`}
                  value={item.number}
                  onChange={(e) => updateItem(gi, ii, { number: Number(e.target.value) })}
                  className="w-24 rounded-md border border-navy-700 p-2"
                />
                <input
                  aria-label={`Group ${gi + 1} question ${ii + 1}`}
                  value={item.question}
                  onChange={(e) => updateItem(gi, ii, { question: e.target.value })}
                  placeholder="Question"
                  className="w-full rounded-md border border-navy-700 p-2"
                />
              </div>
              <textarea
                aria-label={`Group ${gi + 1} question ${ii + 1} answer`}
                value={item.answer}
                onChange={(e) => updateItem(gi, ii, { answer: e.target.value })}
                rows={5}
                placeholder="Answer"
                className="w-full rounded-md border border-navy-700 p-2"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => update(gi, { items: group.items.filter((_, n) => n !== ii) })}
              >
                Remove question
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                update(gi, {
                  items: [...group.items, { number: nextNumber(groups), question: '', answer: '' }],
                })
              }
            >
              Add question
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroups((all) => all.filter((_, index) => index !== gi))}
            >
              Remove group
            </Button>
          </div>
        </Card>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          setGroups((all) => [...all, { id: `group-${all.length + 1}`, title: '', items: [] }])
        }
      >
        Add group
      </Button>
    </EditorShell>
  );
}
