import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginationParams, ScheduleInput } from '@/lib/schemas';

export function useSchedules(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.schedules.list(params),
    queryFn: () => schedulesApi.getAll(params),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleInput) => schedulesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.all() }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduleInput> }) =>
      schedulesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.all() }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schedulesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.all() }),
  });
}

export function useBulkCreateSchedules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: ScheduleInput[]) =>
      Promise.all(rows.map((r) => schedulesApi.create(r))),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.all() }),
  });
}
