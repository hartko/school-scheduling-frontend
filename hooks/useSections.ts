import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginationParams, SectionInput } from '@/lib/schemas';

export function useSections(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.sections.list(params),
    queryFn:  () => sectionsApi.getAll(params),
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SectionInput) => sectionsApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.sections.all() }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SectionInput> }) =>
      sectionsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sections.all() }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sectionsApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.sections.all() }),
  });
}

export function useBulkCreateSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: SectionInput[]) =>
      Promise.all(rows.map((r) => sectionsApi.create(r))),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sections.all() }),
  });
}
