'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface BreadcrumbContextValue {
  labels: Record<string, string>;
  setLabel: (segment: string, label: string) => void;
  clearLabel: (segment: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  labels: {},
  setLabel: () => {},
  clearLabel: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((segment: string, label: string) => {
    setLabels((prev) => ({ ...prev, [segment]: label }));
  }, []);

  const clearLabel = useCallback((segment: string) => {
    setLabels((prev) => { const next = { ...prev }; delete next[segment]; return next; });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel, clearLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}

/** Call this in a page to register a human-readable label for a dynamic URL segment (e.g. an ID). */
export function useDynamicBreadcrumb(segment: string, label: string | undefined) {
  const { setLabel, clearLabel } = useBreadcrumb();
  useEffect(() => {
    if (label) setLabel(segment, label);
    return () => clearLabel(segment);
  }, [segment, label, setLabel, clearLabel]);
}
