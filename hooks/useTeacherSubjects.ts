import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherSubjectsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginationParams, TeacherSubjectInput } from '@/lib/schemas';

export function useTeacherSubjects(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.teacherSubjects.list(params),
    queryFn:  () => teacherSubjectsApi.getAll(params),
  });
}

export function useCreateTeacherSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeacherSubjectInput) => teacherSubjectsApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.teacherSubjects.all() }),
  });
}

export function useDeleteTeacherSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherSubjectsApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.teacherSubjects.all() }),
  });
}

export function useBulkCreateTeacherSubjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: TeacherSubjectInput[]) =>
      Promise.all(rows.map((r) => teacherSubjectsApi.create(r))),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.teacherSubjects.all() }),
  });
}
