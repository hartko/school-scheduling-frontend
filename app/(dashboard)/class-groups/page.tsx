'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { classGroupSchema, type ClassGroupInput } from '@/lib/schemas';
import { useClassGroups, useCreateClassGroup, useUpdateClassGroup, useDeleteClassGroup } from '@/hooks/useClassGroups';
import { useTeacherSubjects } from '@/hooks/useTeacherSubjects';
import { useRoomSchedules } from '@/hooks/useRoomSchedules';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { useRooms } from '@/hooks/useRooms';
import { useSchedules } from '@/hooks/useSchedules';
import { useSections } from '@/hooks/useSections';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { GraduationCap, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface CGRow extends Record<string, unknown> {
  id: string;
  teacher_subject_id: string;
  room_schedule_id: string;
  section_id: string;
  sectionName: string;
  teacherName: string;
  subjectName: string;
  roomName: string;
  day: string;
  timeSlot: string;
}

const columns: Column<CGRow>[] = [
  { key: 'sectionName', header: 'Section', sortable: true, render: (v) => <span className="badge-green">{String(v)}</span> },
  { key: 'teacherName', header: 'Teacher', sortable: true },
  { key: 'subjectName', header: 'Subject', sortable: true },
  { key: 'roomName',    header: 'Room',    sortable: true },
  { key: 'day',         header: 'Day',     render: (v) => <span className="badge-blue">{String(v)}</span> },
  { key: 'timeSlot',    header: 'Time',    render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
];

export default function ClassGroupsPage() {
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CGRow | null>(null);
  const [editing, setEditing]           = useState<CGRow | null>(null);

  // Paginated main data
  const { data: cgData, isLoading, error } = useClassGroups({ page, limit });

  // All related data for dropdowns + row enrichment (limit: 999 = fetch all)
  const { data: tsData }  = useTeacherSubjects({ limit: 999 });
  const { data: rsData }  = useRoomSchedules({ limit: 999 });
  const { data: teachersData }  = useTeachers({ limit: 999 });
  const { data: subjectsData }  = useSubjects({ limit: 999 });
  const { data: roomsData }     = useRooms({ limit: 999 });
  const { data: schedulesData } = useSchedules({ limit: 999 });
  const { data: sectionsData }  = useSections({ limit: 999 });

  const createCG = useCreateClassGroup();
  const updateCG = useUpdateClassGroup();
  const deleteCG = useDeleteClassGroup();

  const teacherSubjects = tsData?.data ?? [];
  const roomSchedules   = rsData?.data ?? [];
  const teachers  = teachersData?.data  ?? [];
  const subjects  = subjectsData?.data  ?? [];
  const rooms     = roomsData?.data     ?? [];
  const schedules = schedulesData?.data ?? [];
  const sections  = sectionsData?.data  ?? [];

  // Enrich rows with human-readable labels
  const rows: CGRow[] = (cgData?.data ?? []).map((cg) => {
    const ts      = teacherSubjects.find((x) => x.id === cg.teacher_subject_id);
    const rs      = roomSchedules.find((x) => x.id === cg.room_schedule_id);
    const section = sections.find((x) => x.id === cg.section_id);
    const teacher = teachers.find((x) => x.id === ts?.teacher_id);
    const subject = subjects.find((x) => x.id === ts?.subject_id);
    const room    = rooms.find((x) => x.id === rs?.room_id);
    const sched   = schedules.find((x) => x.id === rs?.schedule_id);
    return {
      ...cg,
      id:          cg.id!,
      sectionName: section?.name ?? '—',
      teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : '—',
      subjectName: subject?.name ?? '—',
      roomName:    room?.name ?? '—',
      day:         sched?.day ?? '—',
      timeSlot:    sched ? `${formatTime(sched.start_time)} – ${formatTime(sched.end_time)}` : '—',
    };
  });

  // Dropdown options
  const tsOptions = teacherSubjects.map((ts) => {
    const teacher = teachers.find((t) => t.id === ts.teacher_id);
    const subject = subjects.find((s) => s.id === ts.subject_id);
    return { value: ts.id!, label: `${teacher?.first_name} ${teacher?.last_name} → ${subject?.name}` };
  });

  const rsOptions = roomSchedules.map((rs) => {
    const room  = rooms.find((r) => r.id === rs.room_id);
    const sched = schedules.find((s) => s.id === rs.schedule_id);
    return { value: rs.id!, label: `${room?.name} — ${sched?.day} ${sched ? formatTime(sched.start_time) : ''}` };
  });

  const sectionOptions = sections.map((s) => ({ value: s.id!, label: `${s.name} (${s.code})` }));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassGroupInput>({
    resolver: zodResolver(classGroupSchema.omit({ id: true })),
  });

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit   = (row: CGRow) => {
    setEditing(row);
    reset({ teacher_subject_id: row.teacher_subject_id, room_schedule_id: row.room_schedule_id, section_id: row.section_id });
    setModalOpen(true);
  };

  const onSubmit = async (values: ClassGroupInput) => {
    if (editing?.id) await updateCG.mutateAsync({ id: editing.id, data: values });
    else             await createCG.mutateAsync(values);
    setModalOpen(false);
    reset({});
  };

  return (
    <>
      <PageHeader title="Class Groups" description="Assign teacher-subjects to room schedules and sections" icon={<GraduationCap className="w-5 h-5" />}
        actions={<Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Class Group</Button>}
      />
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}
      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#e91e8c', borderTopColor: 'transparent' }} />Loading class groups…</div>
          : <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              searchKeys={['sectionName', 'teacherName', 'subjectName', 'roomName'] as never[]}
              pagination={cgData?.pagination}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
              actions={(row) => (
                <>
                  <button className="btn-icon" onClick={() => openEdit(row as unknown as CGRow)}><Pencil className="w-3.5 h-3.5" /></button>
                  <button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as CGRow)}><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Class Group' : 'Add Class Group'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SelectField label="Section" placeholder="Select a section..." options={sectionOptions} error={errors.section_id?.message} {...register('section_id')} />
          <SelectField label="Teacher → Subject" placeholder="Select teacher-subject..." options={tsOptions} error={errors.teacher_subject_id?.message} {...register('teacher_subject_id')} />
          <SelectField label="Room → Schedule" placeholder="Select room-schedule..." options={rsOptions} error={errors.room_schedule_id?.message} {...register('room_schedule_id')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createCG.isPending || updateCG.isPending}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deleteCG.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteCG.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message={`Delete class group for section "${deleteTarget?.sectionName}"?`}
      />
    </>
  );
}
