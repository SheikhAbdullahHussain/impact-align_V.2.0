'use client';

import { useEffect, useState } from 'react';
import type { ContentStatus, SectionContentDto } from '@impactalign/types';
import { Button, Card } from '@impactalign/ui';
import { adminSiteContentApi, authApi } from '@impactalign/api-client';
import { loadBuiltin } from '../../lib/builtin';
import { paragraphsToText, textToParagraphs } from '../../lib/content-text';
import { reason } from '../../lib/errors';
import { EditorShell } from './editor-shell';

interface TopicState {
  title: string;
  description: string;
  body: string;
}
interface State {
  title: string;
  eyebrow: string;
  intro: string;
  topics: TopicState[];
}

const fromDto = (d: SectionContentDto): State => ({
  title: d.title,
  eyebrow: d.eyebrow,
  intro: d.intro,
  topics: d.topics.map((t) => ({
    title: t.title,
    description: t.description,
    body: paragraphsToText(t.body),
  })),
});

const toDto = (s: State): SectionContentDto => ({
  title: s.title.trim(),
  eyebrow: s.eyebrow.trim(),
  intro: s.intro.trim(),
  topics: s.topics.map((t) => ({
    title: t.title.trim(),
    description: t.description.trim(),
    body: textToParagraphs(t.body),
  })),
});

const field = 'mt-1 w-full rounded-md border border-navy-700 p-2';

export function SectionEditor({
  contentKey,
  label,
}: {
  readonly contentKey: string;
  readonly label: string;
}) {
  const [state, setState] = useState<State>({ title: label, eyebrow: '', intro: '', topics: [] });
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
        const { entry } = await adminSiteContentApi.get('section', contentKey);
        if (!active) return;
        if (entry) {
          setState(fromDto(entry.data as SectionContentDto));
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

  const setTopic = (index: number, patch: Partial<TopicState>) =>
    setState((s) => ({
      ...s,
      topics: s.topics.map((t, n) => (n === index ? { ...t, ...patch } : t)),
    }));

  async function importBuiltin() {
    setError(null);
    try {
      setState(fromDto(await loadBuiltin<SectionContentDto>(`section-${contentKey}`)));
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
      const { entry } = await adminSiteContentApi.save('section', contentKey, {
        status: next,
        data: toDto(state),
      });
      setStatus(entry.status);
      setMessage(
        next === 'PUBLISHED' ? 'Published. The website now shows this page.' : 'Draft saved.',
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
      <Card className="space-y-4">
        <label className="block font-semibold text-navy-900">
          Title
          <input
            aria-label="Title"
            value={state.title}
            onChange={(e) => setState({ ...state, title: e.target.value })}
            className={field}
          />
        </label>
        <label className="block font-semibold text-navy-900">
          Eyebrow (small text above the title)
          <input
            aria-label="Eyebrow"
            value={state.eyebrow}
            onChange={(e) => setState({ ...state, eyebrow: e.target.value })}
            className={field}
          />
        </label>
        <label className="block font-semibold text-navy-900">
          Intro
          <textarea
            aria-label="Intro"
            value={state.intro}
            onChange={(e) => setState({ ...state, intro: e.target.value })}
            rows={3}
            className={field}
          />
        </label>
      </Card>

      <p className="text-sm text-navy-700">
        Topic text is plain text. Leave a blank line between paragraphs. A topic with no text shows
        only its title and description.
      </p>
      {state.topics.map((topic, index) => (
        <Card key={index} className="space-y-3">
          <input
            aria-label={`Topic ${index + 1} title`}
            value={topic.title}
            onChange={(e) => setTopic(index, { title: e.target.value })}
            placeholder="Topic title"
            className="w-full rounded-md border border-navy-700 p-2"
          />
          <input
            aria-label={`Topic ${index + 1} description`}
            value={topic.description}
            onChange={(e) => setTopic(index, { description: e.target.value })}
            placeholder="Short description"
            className="w-full rounded-md border border-navy-700 p-2"
          />
          <textarea
            aria-label={`Topic ${index + 1} text`}
            value={topic.body}
            onChange={(e) => setTopic(index, { body: e.target.value })}
            rows={5}
            placeholder="Page text"
            className="w-full rounded-md border border-navy-700 p-2"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setState((s) => ({ ...s, topics: s.topics.filter((_, n) => n !== index) }))
            }
          >
            Remove topic
          </Button>
        </Card>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          setState((s) => ({
            ...s,
            topics: [...s.topics, { title: '', description: '', body: '' }],
          }))
        }
      >
        Add topic
      </Button>
    </EditorShell>
  );
}
