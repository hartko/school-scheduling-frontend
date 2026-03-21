import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomSchedulesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginationParams, RoomScheduleInput } from '@/lib/schemas';

export function useRoomSchedules(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.roomSchedules.list(params),
    queryFn:  () => roomSchedulesApi.getAll(params),
  });
}

export function useCreateRoomSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RoomScheduleInput) => roomSchedulesApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.roomSchedules.all() }),
  });
}

export function useDeleteRoomSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomSchedulesApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.roomSchedules.all() }),
  });
}

export function useBulkCreateRoomSchedules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: RoomScheduleInput[]) =>
      Promise.all(rows.map((r) => roomSchedulesApi.create(r))),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.roomSchedules.all() }),
  });
}
