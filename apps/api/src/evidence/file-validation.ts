export const MAX_EVIDENCE_BYTES = 8 * 1024 * 1024;

interface Rule {
  readonly mime: string;
  matches(content: Buffer): boolean;
}

const startsWith =
  (...bytes: number[]) =>
  (content: Buffer): boolean =>
    bytes.every((byte, index) => content[index] === byte);

const isPlainText = (content: Buffer): boolean => {
  if (content.subarray(0, 8192).includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(content);
    return true;
  } catch {
    return false;
  }
};

const zip = startsWith(0x50, 0x4b, 0x03, 0x04);

/** Allow-list: extension -> canonical type + signature check on the real bytes. */
const RULES: Readonly<Record<string, Rule>> = {
  pdf: { mime: 'application/pdf', matches: startsWith(0x25, 0x50, 0x44, 0x46, 0x2d) },
  docx: {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    matches: zip,
  },
  xlsx: {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    matches: zip,
  },
  csv: { mime: 'text/csv', matches: isPlainText },
  png: { mime: 'image/png', matches: startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a) },
  jpg: { mime: 'image/jpeg', matches: startsWith(0xff, 0xd8, 0xff) },
  jpeg: { mime: 'image/jpeg', matches: startsWith(0xff, 0xd8, 0xff) },
};

/** Strips paths and unsafe characters; the result is safe in headers and listings. */
export function sanitizeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? '';
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^\w.\- ()]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .slice(-100);
  return cleaned;
}

export type FileCheck =
  | { ok: true; name: string; mime: string }
  | { ok: false; reason: string };

export function checkEvidenceFile(rawName: string, content: Buffer): FileCheck {
  const name = sanitizeFileName(rawName);
  const extension = name.includes('.') ? (name.split('.').pop() ?? '').toLowerCase() : '';
  const rule = RULES[extension];
  if (!rule) {
    return { ok: false, reason: 'This file type is not allowed. Use PDF, DOCX, XLSX, CSV, PNG or JPG.' };
  }
  if (content.length === 0) return { ok: false, reason: 'The file is empty.' };
  if (content.length > MAX_EVIDENCE_BYTES) {
    return { ok: false, reason: 'The file is too large (maximum 8 MB).' };
  }
  if (!rule.matches(content)) {
    return { ok: false, reason: 'The file content does not match its extension.' };
  }
  return { ok: true, name, mime: rule.mime };
}