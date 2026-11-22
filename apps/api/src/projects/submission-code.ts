import { randomInt } from 'node:crypto';

/** 32 characters without 0/O/1/I, so a code can be read out loud or copied by hand. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const SUBMISSION_CODE_PATTERN = /^IASDG-[A-HJ-NP-Z2-9]{6}$/;

export function generateSubmissionCode(): string {
  let suffix = '';
  for (let index = 0; index < 6; index += 1) suffix += ALPHABET.charAt(randomInt(ALPHABET.length));
  return `IASDG-${suffix}`;
}
