'use client';

import { useRef, useState } from 'react';
import type { EvidenceDto } from '@impactalign/types';
import { Button, Card } from '@impactalign/ui';
import { describeError, evidenceApi } from '@impactalign/api-client';

const ACCEPT = '.pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg';
const MAX_BYTES = 8 * 1024 * 1024;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export interface IndicatorOption {
  readonly id: string;
  readonly label: string;
}

export function StepEvidence({
  projectId,
  items,
  onItemsChange,
  indicators,
  onError,
  onBack,
  onNext,
}: {
  readonly projectId: string;
  readonly items: readonly EvidenceDto[];
  readonly onItemsChange: (items: EvidenceDto[]) => void;
  readonly indicators: readonly IndicatorOption[];
  readonly onError: (message: string | null) => void;
  readonly onBack: () => void;
  readonly onNext: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    onError(null);
    const file = input.current?.files?.[0];
    if (!file) {
      onError('Choose a file first.');
      return;
    }
    if (file.size > MAX_BYTES) {
      onError('The file is too large (maximum 8 MB).');
      return;
    }
    setUploading(true);
    try {
      const { evidence } = await evidenceApi.upload(projectId, file);
      onItemsChange([evidence, ...items]);
      if (input.current) input.current.value = '';
    } catch (cause) {
      onError(describeError(cause));
    } finally {
      setUploading(false);
    }
  }

  async function link(item: EvidenceDto, indicatorId: string) {
    onError(null);
    try {
      const { evidence } = await evidenceApi.linkIndicator(
        projectId,
        item.id,
        indicatorId === '' ? null : indicatorId,
      );
      onItemsChange(items.map((current) => (current.id === item.id ? evidence : current)));
    } catch (cause) {
      onError(describeError(cause));
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this file?')) return;
    onError(null);
    try {
      await evidenceApi.remove(projectId, id);
      onItemsChange(items.filter((item) => item.id !== id));
    } catch (cause) {
      onError(describeError(cause));
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl font-bold text-navy-900">Evidence</h2>

      <form onSubmit={upload} className="space-y-3" aria-busy={uploading}>
        <label htmlFor="evidence-file" className="block text-sm font-semibold text-navy-900">
          File (PDF, DOCX, XLSX, CSV, PNG, JPG, up to 8 MB)
        </label>
        <input
          id="evidence-file"
          ref={input}
          type="file"
          accept={ACCEPT}
          disabled={uploading}
          className="block w-full text-sm"
        />
        <Button type="submit" variant="outline" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </form>

      {indicators.length === 0 && (
        <p className="text-sm text-navy-800">
          Map indicators in the previous step to link each file to the indicator it supports.
        </p>
      )}

      {items.length === 0 && <p className="text-sm text-navy-800">No files uploaded yet.</p>}
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-navy-900">{item.fileName}</p>
                    <p className="text-sm text-navy-700">{formatSize(item.sizeBytes)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={evidenceApi.fileUrl(projectId, item.id)}>Download</a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {indicators.length > 0 && (
                  <select
                    aria-label={`Indicator for ${item.fileName}`}
                    value={item.indicatorId ?? ''}
                    onChange={(event) => void link(item, event.target.value)}
                    className="block w-full rounded-md border border-navy-300 bg-white px-3 py-2 text-sm text-navy-950"
                  >
                    <option value="">Not linked to an indicator</option>
                    {indicators.map((indicator) => (
                      <option key={indicator.id} value={indicator.id}>
                        {indicator.label}
                      </option>
                    ))}
                  </select>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
