import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi, scheduleTimesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginationParams, ScheduleFormInput, ScheduleTime } from '@/lib/schemas';

export function useScheduleDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.schedules.detail(String(id)),
    queryFn: () => schedulesApi.getById(id),
    enabled: !!id,
  });
}

export function useSchedules(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.schedules.list(params),
    queryFn: () => schedulesApi.getAll(params),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleFormInput) => schedulesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.all() }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ScheduleFormInput> }) =>
      schedulesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.all() }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => schedulesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.all() }),
  });
}

export function useCreateScheduleTime(scheduleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ScheduleTime, 'id' | 'schedule_id'>) =>
      scheduleTimesApi.create(scheduleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.detail(String(scheduleId)) }),
  });
}

export function useUpdateScheduleTime(scheduleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<ScheduleTime, 'id' | 'schedule_id'>> }) =>
      scheduleTimesApi.update(scheduleId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.detail(String(scheduleId)) }),
  });
}

export function useDeleteScheduleTime(scheduleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => scheduleTimesApi.delete(scheduleId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.detail(String(scheduleId)) }),
  });
}

export function useBulkCreateSchedules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: ScheduleFormInput[]) =>
      Promise.all(rows.map((r) => schedulesApi.create(r))),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.all() }),
  });
}
