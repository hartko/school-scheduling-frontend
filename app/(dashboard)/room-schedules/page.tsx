'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomScheduleSchema, type RoomScheduleInput, type RoomScheduleDetail, type ScheduleTime } from '@/lib/schemas';
import { useRoomSchedules, useCreateRoomSchedule, useDeleteRoomSchedule } from '@/hooks/useRoomSchedules';
import { useRooms } from '@/hooks/useRooms';
import { useSchedules } from '@/hooks/useSchedules';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { SearchableSelectField } from '@/components/ui/SearchableSelectField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { CalendarDays, Plus, Trash2, List, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

// ─── Weekly view helpers ──────────────────────────────────────────────────────
const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const DAY_SHORT: Record<number, string> = { 0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun' };

interface RoomEntry { roomId: number; roomName: string; slots: Map<number, ScheduleTime[]>; }

function buildRoomEntries(allRS: RoomScheduleDetail[]): RoomEntry[] {
  const map = new Map<number, RoomEntry>();
  for (const rs of allRS) {
    if (!map.has(rs.room_id)) map.set(rs.room_id, { roomId: rs.room_id, roomName: rs.room.name, slots: new Map() });
    const entry = map.get(rs.room_id)!;
    for (const t of rs.schedule.scheduleTimes) {
      if (!entry.slots.has(t.day)) entry.slots.set(t.day, []);
      entry.slots.get(t.day)!.push(t);
    }
  }
  for (const entry of map.values())
    for (const [day, slots] of entry.slots)
      entry.slots.set(day, [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time)));
  return Array.from(map.values()).sort((a, b) => a.roomName.localeCompare(b.roomName));
}

// ─── List view row type ───────────────────────────────────────────────────────
interface RSRow extends Record<string, unknown> {
  id: number; room_id: number; schedule_id: number; roomName: string; scheduleName: string;
}

export default function RoomSchedulesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RSRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [view, setView] = useState<'list' | 'weekly'>('weekly');

  const { data: rsData, isLoading, error } = useRoomSchedules({ page, limit });
  const { data: allRsData } = useRoomSchedules({ limit: 999 });
  const { data: roomsData } = useRooms({ limit: 999 });
  const { data: schedulesData } = useSchedules({ limit: 999 });

  const createRS = useCreateRoomSchedule();
  const deleteRS = useDeleteRoomSchedule();

  const rooms = roomsData?.data ?? [];
  const schedules = schedulesData?.data ?? [];
  const allRS = (allRsData?.data ?? []) as RoomScheduleDetail[];

  const rows: RSRow[] = (rsData?.data ?? []).map((rs) => {
    const rsd = rs as unknown as RoomScheduleDetail;
    return {
      ...rs,
      id: rs.id!,
      roomName: rsd.room?.name ?? rooms.find((r) => r.id === rs.room_id)?.name ?? '—',
      scheduleName: rsd.schedule?.name ?? schedules.find((s) => s.id === rs.schedule_id)?.name ?? '—',
    };
  });

  const columns: Column<RSRow>[] = [
    {
      key: '_sel',
      header: (
        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
          checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
          onChange={(e) => setSelectedIds(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} />
      ),
      width: '40px',
      render: (_, row) => (
        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
          checked={selectedIds.has(row.id)}
          onChange={() => setSelectedIds((prev) => { const n = new Set(prev); n.has(row.id) ? n.delete(row.id) : n.add(row.id); return n; })} />
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

  const weeklyEntries = buildRoomEntries(allRS);

  return (
    <>
      <PageHeader title="Room Schedules" description="Assign schedules to rooms and view weekly timetable"
        icon={<CalendarDays className="w-5 h-5" />}
        actions={
          <>
            {selectedIds.size > 0 && view === 'list' && (
              <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setBulkDeleteOpen(true)}>
                Delete ({selectedIds.size})
              </Button>
            )}
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e0e0e0' }}>
              <button onClick={() => setView('weekly')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ background: view === 'weekly' ? '#e91e8c' : '#fff', color: view === 'weekly' ? '#fff' : '#757575' }}>
                <LayoutGrid className="w-3.5 h-3.5" /> Weekly
              </button>
              <button onClick={() => setView('list')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ background: view === 'list' ? '#e91e8c' : '#fff', color: view === 'list' ? '#fff' : '#757575', borderLeft: '1px solid #e0e0e0' }}>
                <List className="w-3.5 h-3.5" /> List
              </button>
            </div>
            <Link href="/room-schedules/create">
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Assign Room</Button>
            </Link>
          </>
        }
      />

      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}

      {view === 'weekly' ? (
        <div className="card overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-ink-400">
              <img src="/images/domi.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse" />Loading schedule…
            </div>
          ) : weeklyEntries.length === 0 ? (
            <p className="text-center py-16 text-sm" style={{ color: '#9e9e9e' }}>No room schedules assigned yet.</p>
          ) : (
            <table className="w-full text-sm border-collapse" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide sticky left-0 bg-white z-10"
                    style={{ color: '#757575', minWidth: 140, borderRight: '1px solid #f0f0f0' }}>Room</th>
                  {DAYS.map((d) => (
                    <th key={d} className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#757575', minWidth: 120 }}>{DAY_SHORT[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeklyEntries.map((entry, i) => (
                  <tr key={entry.roomId} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td className="px-4 py-3 font-medium text-xs sticky left-0 z-10"
                      style={{ color: '#333', borderRight: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      {entry.roomName}
                    </td>
                    {DAYS.map((d) => {
                      const slots = entry.slots.get(d) ?? [];
                      return (
                        <td key={d} className="px-3 py-2 align-top text-center">
                          {slots.length === 0 ? (
                            <span style={{ color: '#e0e0e0' }}>—</span>
                          ) : (
                            <div className="flex flex-col gap-1 items-center">
                              {slots.map((t) => (
                                <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap"
                                  style={{
                                    background: t.is_break ? '#fff8e1' : '#e8f5e9',
                                    color: t.is_break ? '#f57f17' : '#2e7d32',
                                    border: `1px solid ${t.is_break ? '#ffe082' : '#a5d6a7'}`,
                                  }}>
                                  {t.start_time}–{t.end_time}
                                  {t.is_break && <span className="opacity-60 text-xs">brk</span>}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card p-4">
          {isLoading
            ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><img src="/images/domi.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse" />Loading…</div>
            : <DataTable
                data={rows as unknown as Record<string, unknown>[]}
                columns={columns as unknown as Column<Record<string, unknown>>[]}
                searchKeys={['roomName', 'scheduleName'] as never[]}
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
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Assign Schedule to Room">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller name="room_id" control={control}
            render={({ field }) => (
              <SearchableSelectField label="Room" placeholder="Select a room..."
                options={rooms.map((r) => ({ value: String(r.id!), label: r.name }))}
                value={field.value} onChange={field.onChange} error={errors.room_id?.message} />
            )} />
          <Controller name="schedule_id" control={control}
            render={({ field }) => (
              <SearchableSelectField label="Schedule" placeholder="Select a schedule..."
                options={schedules.map((s) => ({ value: String(s.id!), label: s.name }))}
                value={field.value} onChange={field.onChange} error={errors.schedule_id?.message} />
            )} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createRS.isPending}>Assign</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} loading={deleteRS.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteRS.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message={`Remove schedule from room "${deleteTarget?.roomName}"?`} />
      <ConfirmDialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} loading={deleteRS.isPending}
        onConfirm={() => { Array.from(selectedIds).forEach((id) => deleteRS.mutate(id)); setSelectedIds(new Set()); setBulkDeleteOpen(false); }}
        message={`Remove ${selectedIds.size} selected assignment${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`} />
    </>
  );
}
