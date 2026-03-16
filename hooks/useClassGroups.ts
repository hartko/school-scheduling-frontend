import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classGroupsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginationParams, ClassGroupInput } from '@/lib/schemas';

export function useClassGroups(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.classGroups.list(params),
    queryFn: () => classGroupsApi.getAll(params),
  });
}

export function useCreateClassGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClassGroupInput) => classGroupsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.classGroups.all() }),
  });
}

export function useUpdateClassGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassGroupInput> }) =>
      classGroupsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.classGroups.all() }),
  });
}

export function useDeleteClassGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classGroupsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.classGroups.all() }),
  });
}
