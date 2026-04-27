'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomSchema, type Room, type RoomInput, type RoomScheduleDetail } from '@/lib/schemas';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, useBulkCreateRooms } from '@/hooks/useRooms';
import { useSchedules } from '@/hooks/useSchedules';
import { useRoomSchedules, useCreateRoomSchedule, useDeleteRoomSchedule } from '@/hooks/useRoomSchedules';
import { useClassGroups } from '@/hooks/useClassGroups';
import { useTeacherSubjects } from '@/hooks/useTeacherSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { useSections } from '@/hooks/useSections';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { MassUpload } from '@/components/tables/MassUpload';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Building2, Plus, Pencil, Trash2, Upload, Download, CalendarDays, GraduationCap } from 'lucide-react';
import { downloadCSV } from '@/lib/utils';
import Link from 'next/link';
import { WeeklyTimetable, type TimetableEntry, type TimetableSlot } from '@/components/schedule/WeeklyTimetable';


export default function RoomsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [editing, setEditing] = useState<Room | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Room | null>(null);
  const [pendingScheduleIds, setPendingScheduleIds] = useState<Set<number>>(new Set());
  const [assignSaving, setAssignSaving] = useState(false);
  const [classesTarget, setClassesTarget] = useState<Room | null>(null);

  const { data, isLoading, error } = useRooms({ page, limit });
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const bulkCreate = useBulkCreateRooms();
  const { data: schedulesData } = useSchedules({ limit: 999 });
  const { data: allRS } = useRoomSchedules({ limit: 999 });
  const createRS = useCreateRoomSchedule();
  const deleteRS = useDeleteRoomSchedule();
  const schedules = schedulesData?.data ?? [];
  const allRoomSchedules = (allRS?.data ?? []) as unknown as RoomScheduleDetail[];

  const { data: allCGData } = useClassGroups({ limit: 999 });
  const allClassGroups = allCGData?.data ?? [];
  const { data: allTSData } = useTeacherSubjects({ limit: 999 });
  const teacherSubjects = allTSData?.data ?? [];
  const { data: allTeachersData } = useTeachers({ limit: 999 });
  const teachers = allTeachersData?.data ?? [];
  const { data: allSubjectsData } = useSubjects({ limit: 999 });
  const subjects = allSubjectsData?.data ?? [];
  const { data: allSectionsData } = useSections({ limit: 999 });
  const sections = allSectionsData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomInput>({
    resolver: zodResolver(roomSchema.omit({ id: true })),
  });

  const currentPageData = data?.data ?? [];

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: '_sel',
      header: (
        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
          checked={currentPageData.length > 0 && currentPageData.every((r) => selectedIds.has(r.id!))}
          onChange={(e) => setSelectedIds(e.target.checked ? new Set(currentPageData.map((r) => r.id!)) : new Set())} />
      ),
      width: '40px',
      render: (_, row) => (
        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
          checked={selectedIds.has(Number(row.id))}
          onChange={() => setSelectedIds((prev) => {
            const next = new Set(prev);
            const id = Number(row.id);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          })} />
      ),
    },
    { key: 'name', header: 'Room Name', sortable: true },
    { key: 'capacity', header: 'Capacity', sortable: true, render: (v) => <span className="font-mono text-sm">{String(v)} seats</span> },
    { key: 'level', header: 'Level', sortable: true, render: (v) => <span className="badge-blue">{String(v)}</span> },
    {
      key: '_schedules', header: 'Schedules',
      render: (_, row) => {
        const assigned = allRoomSchedules.filter((rs) => rs.room_id === Number(row.id));
        if (assigned.length === 0) return <span style={{ color: '#bdbdbd' }} className="text-xs">—</span>;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-1">
              {assigned.slice(0, 3).map((rs) => (
                <span key={rs.id} className="badge-blue font-mono text-xs">
                  {rs.schedule?.schedule_code ?? rs.schedule?.name ?? schedules.find((s) => s.id === rs.schedule_id)?.schedule_code ?? rs.schedule_id}
                </span>
              ))}
              {assigned.length > 3 && <span className="text-xs" style={{ color: '#9e9e9e' }}>+{assigned.length - 3} more</span>}
            </div>
            <Link href={`/rooms/${row.id}/schedule`} className="text-xs" style={{ color: '#e91e8c' }}>
              View schedule →
            </Link>
          </div>
        );
      },
    },
    {
      key: '_classes', header: 'Classes',
      render: (_, row) => {
        const roomRS = allRoomSchedules.filter((rs) => rs.room_id === Number(row.id)).map((rs) => rs.id);
        const count = allClassGroups.filter((cg) => roomRS.includes(cg.room_schedule_id!)).length;
        if (count === 0) return <span style={{ color: '#bdbdbd' }} className="text-xs">—</span>;
        return (
          <button className="text-xs font-medium" style={{ color: '#e91e8c' }}
            onClick={() => setClassesTarget(row as unknown as Room)}>
            {count} class{count !== 1 ? 'es' : ''}
          </button>
        );
      },
    },
  ];

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: Room) => { setEditing(r); reset(r); setModalOpen(true); };
  const openAssign = (r: Room) => { setAssignTarget(r); setPendingScheduleIds(new Set()); };

  useEffect(() => {
    if (!assignTarget) return;
    const current = allRoomSchedules.filter((rs) => rs.room_id === assignTarget.id).map((rs) => rs.schedule_id);
    setPendingScheduleIds(new Set(current));
  }, [assignTarget, allRoomSchedules]);

  const onSaveAssign = async () => {
    if (!assignTarget?.id) return;
    setAssignSaving(true);
    try {
      const current = allRoomSchedules.filter((rs) => rs.room_id === assignTarget.id);
      const currentIds = new Set(current.map((rs) => rs.schedule_id));
      const toDelete = current.filter((rs) => !pendingScheduleIds.has(rs.schedule_id));
      const toCreate = Array.from(pendingScheduleIds).filter((id) => !currentIds.has(id));
      await Promise.all(toDelete.map((rs) => deleteRS.mutateAsync(rs.id!)));
      await Promise.all(toCreate.map((schedule_id) => createRS.mutateAsync({ room_id: assignTarget.id!, schedule_id })));
      setAssignTarget(null);
    } finally {
      setAssignSaving(false);
    }
  };

  const onSubmit = async (values: RoomInput) => {
    if (editing?.id) await updateRoom.mutateAsync({ id: editing.id, data: values });
    else await createRoom.mutateAsync(values);
    setModalOpen(false); reset({});
  };

  const parseRow = (row: Record<string, string>): RoomInput | null => {
    const r = roomSchema.omit({ id: true }).safeParse({ name: row.name?.trim(), capacity: parseInt(row.capacity, 10), level: row.level?.trim() });
    return r.success ? r.data : null;
  };

  // ── Room timetable data ────────────────────────────────────────────────────
  const roomClassGroups = classesTarget
    ? (() => {
        const roomRS = allRoomSchedules.filter((rs) => rs.room_id === classesTarget.id).map((rs) => rs.id);
        return allClassGroups.filter((cg) => roomRS.includes(cg.room_schedule_id!));
      })()
    : [];

  const roomScheduleTimes: TimetableSlot[] = (() => {
    if (!classesTarget) return [];
    const seen = new Set<number>();
    const result: TimetableSlot[] = [];
    const roomRS = allRoomSchedules.filter((rs) => rs.room_id === classesTarget.id);
    for (const rs of roomRS) {
      for (const st of rs.schedule?.scheduleTimes ?? []) {
        if (!seen.has(st.id)) { seen.add(st.id); result.push(st); }
      }
    }
    return result;
  })();

  const roomTimetableEntries: TimetableEntry[] = roomClassGroups
    .filter((cg) => cg.schedule_time_id != null)
    .map((cg) => {
      const section = sections.find((x) => x.id === cg.section_id);
      const ts = teacherSubjects.find((x) => x.id === cg.teacher_subject_id);
      const subject = subjects.find((x) => x.id === ts?.subject_id);
      const teacher = teachers.find((x) => x.id === ts?.teacher_id);
      return {
        scheduleTimeId: cg.schedule_time_id!,
        label: section?.name ?? `Section ${cg.section_id}`,
        sublabel: subject?.code
          ? `${subject.code}${teacher ? ` · ${teacher.last_name}` : ''}`
          : teacher?.last_name,
        colorKey: String(cg.section_id),
      };
    });

  return (
    <>
      <PageHeader title="Rooms" description="Manage classroom and facility records" icon={<Building2 className="w-5 h-5" />}
        actions={<>
          {selectedIds.size > 0 && (
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setBulkDeleteOpen(true)}>
              Delete ({selectedIds.size})
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => downloadCSV(data?.data ?? [], 'rooms.csv')}>Export</Button>
          <Button variant="secondary" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setUploadOpen(true)}>Mass Upload</Button>
          <Link href="/room-schedules/create">
            <Button variant="secondary" size="sm" icon={<CalendarDays className="w-3.5 h-3.5" />}>Assign Schedules</Button>
          </Link>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Room</Button>
        </>}
      />

      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}

      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><img src="/images/domi.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse" />Loading rooms…</div>
          : <DataTable data={currentPageData as unknown as Record<string, unknown>[]} columns={columns}
              searchKeys={['name', 'level'] as never[]} pagination={data?.pagination}
              onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
              onLimitChange={(l) => { setLimit(l); setPage(1); setSelectedIds(new Set()); }}
              actions={(row) => (
                <>
                  <button className="btn-icon" title="View Classes" onClick={() => setClassesTarget(row as unknown as Room)}><GraduationCap className="w-3.5 h-3.5" /></button>
                  <button className="btn-icon" title="Assign Schedules" onClick={() => openAssign(row as unknown as Room)}><CalendarDays className="w-3.5 h-3.5" /></button>
                  <button className="btn-icon" onClick={() => openEdit(row as unknown as Room)}><Pencil className="w-3.5 h-3.5" /></button>
                  <button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as Room)}><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )} />}
      </div>

      {/* Create/edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField label="Room Name" error={errors.name?.message} {...register('name')} />
          <TextField label="Capacity" type="number" error={errors.capacity?.message} {...register('capacity')} />
          <TextField label="Level" type="number" error={errors.level?.message} {...register('level')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createRoom.isPending || updateRoom.isPending}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} loading={deleteRoom.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteRoom.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message={`Delete room "${deleteTarget?.name}"?`} />
      <ConfirmDialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} loading={deleteRoom.isPending}
        onConfirm={() => { Array.from(selectedIds).forEach((id) => deleteRoom.mutate(id)); setSelectedIds(new Set()); setBulkDeleteOpen(false); }}
        message={`Delete ${selectedIds.size} selected room${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`} />

      <MassUpload<RoomInput> open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={(rows) => bulkCreate.mutate(rows)}
        templateFields={['name', 'capacity', 'level']} entityName="Rooms" parseRow={parseRow} />

      {/* Assign schedules modal */}
      <Modal open={!!assignTarget} onClose={() => setAssignTarget(null)} title={`Assign Schedules — ${assignTarget?.name ?? ''}`} size="md">
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#9e9e9e' }}>Select schedules available for this room.</p>
          <div className="rounded-lg overflow-hidden max-h-72 overflow-y-auto" style={{ border: '1.5px solid #e0e0e0' }}>
            {schedules.length === 0 ? (
              <p className="text-center py-6 text-xs" style={{ color: '#9e9e9e' }}>No schedules found.</p>
            ) : schedules.map((s) => (
              <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors"
                style={{ borderBottom: '1px solid #f5f5f5', background: pendingScheduleIds.has(s.id!) ? '#fdf2f8' : '#fff' }}>
                <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5 shrink-0"
                  checked={pendingScheduleIds.has(s.id!)}
                  onChange={() => setPendingScheduleIds((prev) => { const n = new Set(prev); n.has(s.id!) ? n.delete(s.id!) : n.add(s.id!); return n; })} />
                <span className="flex-1">{s.name}</span>
                {s.schedule_code && <span className="font-mono text-xs" style={{ color: '#9e9e9e' }}>{s.schedule_code}</span>}
              </label>
            ))}
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs" style={{ color: '#9e9e9e' }}>{pendingScheduleIds.size} selected</span>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setAssignTarget(null)}>Cancel</Button>
              <Button onClick={onSaveAssign} loading={assignSaving}>Save</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Room classes timetable modal */}
      <Modal open={!!classesTarget} onClose={() => setClassesTarget(null)} title={`Classes in ${classesTarget?.name ?? ''}`} size="xl">
        <div className="space-y-3">
          {roomClassGroups.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#9e9e9e' }}>No classes assigned to this room yet.</p>
          ) : (
            <WeeklyTimetable
              scheduleTimes={roomScheduleTimes}
              entries={roomTimetableEntries}
            />
          )}
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs" style={{ color: '#9e9e9e' }}>{roomClassGroups.length} class group{roomClassGroups.length !== 1 ? 's' : ''}</span>
            <Button variant="secondary" onClick={() => setClassesTarget(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
