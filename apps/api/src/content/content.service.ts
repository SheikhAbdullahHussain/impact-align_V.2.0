import {
  AuditEvent,
  CONTENT_KEYS,
  type ContentEntryDto,
  type ContentKind,
  type ContentListItemDto,
  type FaqBlockDto,
  type FaqContentDto,
  type FaqGroupDto,
  type FaqItemDto,
  type LegalContentDto,
  type PlansContentDto,
  type SectionContentDto,
} from '@impactalign/types';
import type { AuditService } from '../auth/audit.service';
import type { RequestContext } from '../auth/auth.service';
import { HttpError } from '../common/http-error';
import type { ContentRecord, Repositories, UserRecord } from '../data/repositories';

const GROUP_ID_PATTERN = /^[a-z0-9-]{1,60}$/;
/** Internal path ("/x") or https only. Blocks javascript: and protocol-relative links. */
const LINK_PATTERN = /^\/(?!\/)[^\s]*$|^https:\/\/[^\s]+$/;

const bad = (message: string) => new HttpError(400, 'VALIDATION_ERROR', message);

const text = (value: unknown, max: number, what: string, allowEmpty = false): string => {
  if (typeof value !== 'string') throw bad(`${what} must be text.`);
  const trimmed = value.trim();
  if ((!allowEmpty && trimmed.length === 0) || trimmed.length > max) {
    throw bad(`${what} must be ${allowEmpty ? 'at most' : '1 to'} ${max} characters.`);
  }
  return trimmed;
};

const list = (value: unknown, min: number, max: number, what: string): unknown[] => {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw bad(`${what} must have ${min} to ${max} entries.`);
  }
  return value;
};

const obj = (value: unknown, what: string): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw bad(`${what} is not valid.`);
  }
  return value as Record<string, unknown>;
};

const parseBlock = (value: unknown): FaqBlockDto =>
  Array.isArray(value)
    ? list(value, 1, 50, 'A bullet list').map((entry) => text(entry, 500, 'A bullet'))
    : text(value, 5000, 'A paragraph');

/** Checks the shape and size of an FAQ document. Plain text only; the site renders it as text. */
export function parseFaqContent(input: unknown): FaqContentDto {
  const root = obj(input, 'FAQ content');
  const groupIds = new Set<string>();
  const numbers = new Set<number>();
  let total = 0;

  const groups: FaqGroupDto[] = list(root['groups'], 1, 30, 'FAQ groups').map((raw) => {
    const g = obj(raw, 'A group');
    const id = text(g['id'], 60, 'Group id');
    if (!GROUP_ID_PATTERN.test(id)) throw bad('Group id may use a-z, 0-9 and dashes only.');
    if (groupIds.has(id)) throw bad(`Group id "${id}" is used twice.`);
    groupIds.add(id);

    const items: FaqItemDto[] = list(g['items'], 1, 100, 'Group items').map((rawItem) => {
      const item = obj(rawItem, 'A question');
      const number = item['number'];
      if (typeof number !== 'number' || !Number.isInteger(number) || number < 1 || number > 9999) {
        throw bad('Question numbers must be whole numbers from 1 to 9999.');
      }
      if (numbers.has(number)) throw bad(`Question number ${number} is used twice.`);
      numbers.add(number);
      total += 1;
      return {
        number,
        question: text(item['question'], 400, 'A question'),
        answer: list(item['answer'], 1, 20, 'An answer').map(parseBlock),
      };
    });
    return { id, title: text(g['title'], 120, 'Group title'), items };
  });

  if (total > 300) throw bad('An FAQ can hold at most 300 questions.');
  return { groups };
}

export function parseLegalContent(input: unknown): LegalContentDto {
  const root = obj(input, 'Legal content');
  return { title: text(root['title'], 120, 'Title'), body: text(root['body'], 60_000, 'Text') };
}

export function parseSectionContent(input: unknown): SectionContentDto {
  const root = obj(input, 'Section content');
  return {
    title: text(root['title'], 120, 'Title'),
    eyebrow: text(root['eyebrow'], 60, 'Eyebrow', true),
    intro: text(root['intro'], 1000, 'Intro'),
    topics: list(root['topics'], 0, 40, 'Topics').map((raw) => {
      const t = obj(raw, 'A topic');
      return {
        title: text(t['title'], 120, 'Topic title'),
        description: text(t['description'], 300, 'Topic description', true),
        body: list(t['body'] ?? [], 0, 30, 'Topic text').map((p) => text(p, 3000, 'A paragraph')),
      };
    }),
  };
}

export function parsePlansContent(input: unknown): PlansContentDto {
  const root = obj(input, 'Plans content');
  return {
    title: text(root['title'], 120, 'Title'),
    intro: text(root['intro'], 1000, 'Intro', true),
    plans: list(root['plans'], 0, 12, 'Plans').map((raw) => {
      const p = obj(raw, 'A plan');
      const ctaLabel = p['ctaLabel'] ? text(p['ctaLabel'], 60, 'Button label') : null;
      const ctaHref = p['ctaHref'] ? text(p['ctaHref'], 300, 'Button link') : null;
      if ((ctaLabel === null) !== (ctaHref === null))
        throw bad('A button needs both a label and a link.');
      if (ctaHref !== null && !LINK_PATTERN.test(ctaHref)) {
        throw bad('A button link must start with / or https://.');
      }
      return {
        name: text(p['name'], 80, 'Plan name'),
        priceText: text(p['priceText'], 60, 'Price text', true),
        description: text(p['description'], 500, 'Plan description', true),
        features: list(p['features'] ?? [], 0, 20, 'Features').map((f) =>
          text(f, 200, 'A feature'),
        ),
        ctaLabel,
        ctaHref,
      };
    }),
  };
}

const PARSERS: Record<ContentKind, (input: unknown) => unknown> = {
  FAQ: parseFaqContent,
  SECTION: parseSectionContent,
  LEGAL: parseLegalContent,
  PLANS: parsePlansContent,
};

const KIND_PARAMS = new Map<string, ContentKind>([
  ['faq', 'FAQ'],
  ['section', 'SECTION'],
  ['legal', 'LEGAL'],
  ['plans', 'PLANS'],
]);

const toEntry = (r: ContentRecord): ContentEntryDto => ({
  kind: r.kind,
  key: r.key,
  status: r.status,
  data: r.data,
  updatedAt: r.updatedAt.toISOString(),
  publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
});

export class ContentService {
  constructor(private readonly deps: { repos: Repositories; audit: AuditService }) {}

  /** Only known kinds and known keys exist. Everything else is "not found". */
  private resolve(kindParam: string, key: string): ContentKind {
    const kind = KIND_PARAMS.get(kindParam);
    if (!kind || !CONTENT_KEYS[kind].some((k) => k.key === key)) {
      throw HttpError.notFound('Content not found');
    }
    return kind;
  }

  /** Public: only published content. Drafts look like they do not exist. */
  async getPublished(kindParam: string, key: string): Promise<ContentEntryDto> {
    const kind = this.resolve(kindParam, key);
    const record = await this.deps.repos.content.find(kind, key);
    if (!record || record.status !== 'PUBLISHED') throw HttpError.notFound('Content not found');
    return toEntry(record);
  }

  /** Admin: the saved entry (draft or published), or null if nothing was saved yet. */
  async getEntry(kindParam: string, key: string): Promise<ContentEntryDto | null> {
    const kind = this.resolve(kindParam, key);
    const record = await this.deps.repos.content.find(kind, key);
    return record ? toEntry(record) : null;
  }

  async list(): Promise<ContentListItemDto[]> {
    return (await this.deps.repos.content.list()).map((r) => ({
      kind: r.kind,
      key: r.key,
      status: r.status,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async save(
    actor: UserRecord,
    kindParam: string,
    key: string,
    body: unknown,
    ctx: RequestContext,
  ): Promise<ContentEntryDto> {
    const { repos } = this.deps;
    const kind = this.resolve(kindParam, key);
    const input = (typeof body === 'object' && body !== null ? body : {}) as {
      status?: unknown;
      data?: unknown;
    };
    const status = input.status;
    if (status !== 'DRAFT' && status !== 'PUBLISHED')
      throw bad('Status must be DRAFT or PUBLISHED.');
    const data = PARSERS[kind](input.data);

    const existing = await repos.content.find(kind, key);
    const publishedAt =
      status === 'PUBLISHED'
        ? existing?.status === 'PUBLISHED' && existing.publishedAt
          ? existing.publishedAt
          : new Date()
        : null;

    const saved = await repos.content.upsert(kind, key, {
      status,
      data,
      publishedAt,
      updatedById: actor.id,
    });
    await this.deps.audit.record({
      action: AuditEvent.CONTENT_UPDATED,
      outcome: 'success',
      actorId: actor.id,
      resourceType: 'content',
      resourceId: `${kind}:${key}`,
      requestId: ctx.requestId,
      ipAddress: ctx.ipAddress,
      metadata: { kind, key, status },
    });
    return toEntry(saved);
  }
}
