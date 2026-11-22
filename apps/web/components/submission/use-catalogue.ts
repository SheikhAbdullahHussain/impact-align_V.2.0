'use client';

import { useEffect, useRef, useState } from 'react';
import type { SdgIndicatorDto, SdgTargetDto } from '@impactalign/types';
import { sdgsApi } from '@impactalign/api-client';

export interface SdgCatalogue {
  readonly targets: SdgTargetDto[];
  readonly indicators: SdgIndicatorDto[];
}

/** Loads the targets and indicators of the given SDG numbers, once per number. */
export function useCatalogue(numbers: readonly number[]) {
  const [catalogue, setCatalogue] = useState<Record<number, SdgCatalogue>>({});
  const [failed, setFailed] = useState(false);
  const requested = useRef(new Set<number>());
  const key = numbers.join(',');

  useEffect(() => {
    const wanted = key === '' ? [] : key.split(',').map(Number);
    for (const number of wanted) {
      if (requested.current.has(number)) continue;
      requested.current.add(number);
      Promise.all([sdgsApi.targets(number), sdgsApi.indicators(number)])
        .then(([targets, indicators]) => {
          setCatalogue((current) => ({
            ...current,
            [number]: { targets: targets.data, indicators: indicators.data },
          }));
        })
        .catch(() => {
          requested.current.delete(number);
          setFailed(true);
        });
    }
  }, [key]);

  return { catalogue, failed };
}
