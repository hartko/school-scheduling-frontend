import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginationParams, RoomInput } from '@/lib/schemas';

export function useRooms(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.rooms.list(params),
    queryFn:  () => roomsApi.getAll(params),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RoomInput) => roomsApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.rooms.all() }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoomInput> }) =>
      roomsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rooms.all() }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomsApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.rooms.all() }),
  });
}

export function useBulkCreateRooms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: RoomInput[]) =>
      Promise.all(rows.map((r) => roomsApi.create(r))),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rooms.all() }),
  });
}
