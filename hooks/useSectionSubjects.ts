import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sectionSubjectsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useAllSectionSubjects() {
  return useQuery({
    queryKey: queryKeys.sectionSubjects.all(),
    queryFn: () => sectionSubjectsApi.getAll(),
  });
}

export function useSectionSubjects(sectionId: number | null) {
  return useQuery({
    queryKey: queryKeys.sectionSubjects.bySectionId(sectionId!),
    queryFn: () => sectionSubjectsApi.getBySectionId(sectionId!),
    enabled: sectionId !== null,
  });
}

export function useBulkAssignSectionSubjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, assignments }: { sectionId: number; assignments: { subject_id: number; units?: number }[] }) =>
      sectionSubjectsApi.bulkAssign(sectionId, assignments),
    onSuccess: (_, { sectionId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.sectionSubjects.bySectionId(sectionId) }),
  });
}
