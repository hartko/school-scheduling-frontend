import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginationParams, SubjectInput } from '@/lib/schemas';

export function useSubjects(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.subjects.list(params),
    queryFn:  () => subjectsApi.getAll(params),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubjectInput) => subjectsApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.subjects.all() }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubjectInput> }) =>
      subjectsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.subjects.all() }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.subjects.all() }),
  });
}

export function useBulkCreateSubjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: SubjectInput[]) =>
      Promise.all(rows.map((r) => subjectsApi.create(r))),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.subjects.all() }),
  });
}
