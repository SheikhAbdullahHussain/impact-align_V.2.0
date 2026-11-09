import { describe, expect, it } from 'vitest';
import { checkEvidenceFile, sanitizeFileName } from './file-validation';

const pdf = Buffer.from('%PDF-1.4 test');

describe('checkEvidenceFile', () => {
  it('accepts a real PDF and reports a canonical type', () => {
    expect(checkEvidenceFile('Report.PDF', pdf)).toEqual({
      ok: true,
      name: 'Report.PDF',
      mime: 'application/pdf',
    });
  });

  it('rejects disallowed extensions, empty files and mismatched content', () => {
    expect(checkEvidenceFile('tool.exe', pdf).ok).toBe(false);
    expect(checkEvidenceFile('noext', pdf).ok).toBe(false);
    expect(checkEvidenceFile('a.pdf', Buffer.alloc(0)).ok).toBe(false);
    expect(checkEvidenceFile('fake.pdf', Buffer.from('MZ\x90\x00')).ok).toBe(false);
    expect(checkEvidenceFile('fake.png', pdf).ok).toBe(false);
  });

  it('treats binary data as not CSV', () => {
    expect(checkEvidenceFile('data.csv', Buffer.from('a,b\n1,2\n')).ok).toBe(true);
    expect(checkEvidenceFile('data.csv', Buffer.from([0x61, 0x00, 0x62])).ok).toBe(false);
  });
});

describe('sanitizeFileName', () => {
  it('removes paths and unsafe characters', () => {
    expect(sanitizeFileName('..\\..\\etc/passwd.pdf')).toBe('passwd.pdf');
    expect(sanitizeFileName('my "file"<1>.pdf')).toBe('my _file__1_.pdf');
    expect(sanitizeFileName('.hidden.pdf')).toBe('hidden.pdf');
  });
});