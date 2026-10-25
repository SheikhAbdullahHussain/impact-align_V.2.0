import { describe, expect, it } from 'vitest';
import { AuditLog } from './models/audit-log.model';

describe('AuditLog model', () => {
  it('requires an action and outcome', () => {
    const error = new AuditLog({}).validateSync();
    expect(error?.errors['action']).toBeDefined();
    expect(error?.errors['outcome']).toBeDefined();
  });

  it('rejects unknown outcomes and accepts a valid entry', () => {
    expect(
      new AuditLog({ action: 'X', outcome: 'maybe' }).validateSync()?.errors['outcome'],
    ).toBeDefined();
    expect(new AuditLog({ action: 'X', outcome: 'success' }).validateSync()).toBeUndefined();
  });

  it('blocks updates and deletes (append-only)', async () => {
    await expect(AuditLog.updateOne({}, { action: 'Y' }).exec()).rejects.toThrow(/immutable/);
    await expect(AuditLog.deleteMany({}).exec()).rejects.toThrow(/immutable/);
  });
});
