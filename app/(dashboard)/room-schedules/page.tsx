'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomScheduleSchema, type RoomScheduleInput } from '@/lib/schemas';
import { useRoomSchedules, useCreateRoomSchedule, useDeleteRoomSchedule } from '@/hooks/useRoomSchedules';
import { useRooms } from '@/hooks/useRooms';
import { useSchedules } from '@/hooks/useSchedules';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { SearchableSelectField } from '@/components/ui/SearchableSelectField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatTime } from '@/lib/utils';
import { Controller } from 'react-hook-form';

interface RSRow extends Record<string, unknown> {
  id: number;
  room_id: number;
  schedule_id: number;
  roomName: string;
  scheduleName: string;
}

export default function RoomSchedulesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RSRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: rsData, isLoading, error } = useRoomSchedules({ page, limit });
  const { data: roomsData } = useRooms({ limit: 999 });
  const { data: schedulesData } = useSchedules({ limit: 999 });

  const createRS = useCreateRoomSchedule();
  const deleteRS = useDeleteRoomSchedule();

  const rooms = roomsData?.data ?? [];
  const schedules = schedulesData?.data ?? [];

  const rows: RSRow[] = (rsData?.data ?? []).map((rs) => {
    const room = rooms.find((r) => r.id === rs.room_id);
    const sched = schedules.find((s) => s.id === rs.schedule_id);
    return {
      ...rs,
      id: rs.id!,
      roomName: room?.name ?? '—',
      day: Number(sched?.day) ?? '—',
      scheduleName: sched?.name ?? '—',
    };
  });

  const columns: Column<RSRow>[] = [
    {
      key: '_sel', header: (
  <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
    checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
    onChange={(e) => setSelectedIds(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} />
), width: '40px',
      render: (_, row) => (
        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
          checked={selectedIds.has(row.id)}
          onChange={() => setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(row.id) ? next.delete(row.id) : next.add(row.id);
            return next;
          })} />
      ),
    },
    { key: 'roomName', header: 'Room', sortable: true },
    { key: 'scheduleName', header: 'Schedule', sortable: true },
  ];

  const { handleSubmit, reset, control, formState: { errors } } = useForm<RoomScheduleInput>({
    resolver: zodResolver(roomScheduleSchema.omit({ id: true })),
  });

  const onSubmit = async (values: RoomScheduleInput) => {
    await createRS.mutateAsync(values);
    setModalOpen(false);
    reset({});
  };

  return (
    <>
      <PageHeader title="Room Schedules" description="Assign time slots to rooms" icon={<CalendarDays className="w-5 h-5" />}
        actions={
          <>
            {selectedIds.size > 0 && (
              <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setBulkDeleteOpen(true)}>
                Delete ({selectedIds.size})
              </Button>
            )}
            <Link href="/room-schedules/create">
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Assign Room</Button>
            </Link>
          </>
        }
      />
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}
      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><img src="/images/domi.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse" />Loading…</div>
          : <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              searchKeys={['roomName', 'day'] as never[]}
              pagination={rsData?.pagination}
              onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
              onLimitChange={(l) => { setLimit(l); setPage(1); setSelectedIds(new Set()); }}
              actions={(row) => (
                <button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as RSRow)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Assign Schedule to Room">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="room_id"
            control={control}
            render={({ field }) => (
              <SearchableSelectField
                label="Room"
                placeholder="Select a room..."
                options={rooms.map((r) => ({ value: String(r.id!), label: `${r.name}` }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.room_id?.message}
              />
            )}
          />
          <Controller
            name="schedule_id"
            control={control}
            render={({ field }) => (
              <SearchableSelectField
                label="Schedule"
                placeholder="Select a schedule..."
                options={schedules.map((s) => ({ value: String(s.id!), label: s.name }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.schedule_id?.message}
              />
            )}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createRS.isPending}>Assign</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deleteRS.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteRS.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message={`Remove schedule from room "${deleteTarget?.roomName}"?`}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        loading={deleteRS.isPending}
        onConfirm={() => { Array.from(selectedIds).forEach((id) => deleteRS.mutate(id)); setSelectedIds(new Set()); setBulkDeleteOpen(false); }}
        message={`Remove ${selectedIds.size} selected assignment${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`}
      />
    </>
  );
}
