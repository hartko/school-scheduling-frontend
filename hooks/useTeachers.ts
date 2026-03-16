import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginationParams, TeacherInput } from '@/lib/schemas';

export function useTeachers(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.teachers.list(params),
    queryFn:  () => teachersApi.getAll(params),
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeacherInput) => teachersApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.teachers.all() }),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeacherInput> }) =>
      teachersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.teachers.all() }),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teachersApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.teachers.all() }),
  });
}

export function useBulkCreateTeachers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: TeacherInput[]) =>
      Promise.all(rows.map((r) => teachersApi.create(r))),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.teachers.all() }),
  });
}
