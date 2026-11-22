import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { Project } from './index';

describe('Project model', () => {
  it('defaults to a project proposal with no code and no organization', () => {
    const project = new Project({ ownerId: new Types.ObjectId(), title: 'A project' });
    expect(project.validateSync()).toBeUndefined();
    expect(project.submissionType).toBe('PROJECT_PROPOSAL');
    expect(project.code).toBeNull();
    expect(project.organizationId).toBeNull();
  });

  it('rejects an unknown submission type', () => {
    const project = new Project({
      ownerId: new Types.ObjectId(),
      title: 'A project',
      submissionType: 'SPACESHIP',
    });
    expect(project.validateSync()?.errors['submissionType']).toBeDefined();
  });

  it('keeps the code unique only once it is set', () => {
    const entry = Project.schema.indexes().find(([keys]) => 'code' in keys);
    expect(entry?.[1]).toMatchObject({
      unique: true,
      partialFilterExpression: { code: { $type: 'string' } },
    });
  });
});
