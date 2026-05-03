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
import { useAllSectionSubjects } from '@/hooks/useSectionSubjects';
import { useScheduler } from '@/hooks/useScheduler';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { GraduationCap, Plus, Pencil, Trash2, Wand2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatTime } from '@/lib/utils';
import type { SectionSubject, RoomScheduleDetail } from '@/lib/schemas';

interface CGRow extends Record<string, unknown> {
  id: number;
  teacher_subject_id: number;
  room_schedule_id: number;
  section_id: number;
  sectionName: string;
  teacherName: string;
  subjectName: string;
  roomName: string;
  day: number;
  timeSlot: string;
}

export default function ClassGroupsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CGRow | null>(null);
  const [editing, setEditing] = useState<CGRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const { data: cgData, isLoading, error } = useClassGroups({ page, limit });

  const { data: tsData } = useTeacherSubjects({ limit: 999 });
  const { data: rsData } = useRoomSchedules({ limit: 999 });
  const { data: teachersData } = useTeachers({ limit: 999 });
  const { data: subjectsData } = useSubjects({ limit: 999 });
  const { data: roomsData } = useRooms({ limit: 999 });
  const { data: schedulesData } = useSchedules({ limit: 999 });
  const { data: sectionsData } = useSections({ limit: 999 });
  const { data: allSectionSubjects } = useAllSectionSubjects();

  const createCG = useCreateClassGroup();
  const updateCG = useUpdateClassGroup();
  const deleteCG = useDeleteClassGroup();
  const scheduler = useScheduler();

  const teacherSubjects = tsData?.data ?? [];
  const roomSchedules = (rsData?.data ?? []) as unknown as RoomScheduleDetail[];
  const teachers = teachersData?.data ?? [];
  const subjects = subjectsData?.data ?? [];
  const rooms = roomsData?.data ?? [];
  const schedules = schedulesData?.data ?? [];
  const sections = sectionsData?.data ?? [];
  const sectionSubjects: SectionSubject[] = allSectionSubjects ?? [];

  // ── Generate modal: which sections are selected ───────────────────────────
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set());

  const sectionsWithSubjects = sections.filter((s) =>
    sectionSubjects.some((ss) => ss.section_id === s.id)
  );

  const openGenerate = () => {
    scheduler.reset();
    setSelectedSections(new Set(sectionsWithSubjects.map((s) => s.id!)));
    setGenerateOpen(true);
  };

  const closeGenerate = () => {
    scheduler.reset();
    setGenerateOpen(false);
  };

  const onGenerate = () => {
    const assignments = Array.from(selectedSections).map((sectionId) => {
      const subjs = sectionSubjects
        .filter((ss) => ss.section_id === sectionId)
        .map((ss) => ({ subject_id: ss.subject_id, units: ss.units ?? 1 }));
      return { section_id: sectionId, subjects: subjs };
    }).filter((a) => a.subjects.length > 0);

    scheduler.generate({ assignments });
  };

  const DAY_LABELS: Record<number, string> = { 0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun' };

  // ── Table rows ────────────────────────────────────────────────────────────
  const rows: CGRow[] = (cgData?.data ?? []).map((cg) => {
    const ts = teacherSubjects.find((x) => x.id === cg.teacher_subject_id);
    const rs = roomSchedules.find((x) => x.id === cg.room_schedule_id);
    const section = sections.find((x) => x.id === cg.section_id);
    const teacher = teachers.find((x) => x.id === ts?.teacher_id);
    const subject = subjects.find((x) => x.id === ts?.subject_id);
    const st = rs?.schedule?.scheduleTimes?.find((t) => t.id === cg.schedule_time_id);
    return {
      ...cg,
      id: cg.id!,
      sectionName: section?.name ?? '—',
      teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : '—',
      subjectName: subject?.name ?? '—',
      roomName: rs?.room?.name ?? '—',
      day: st?.day ?? -1,
      timeSlot: st ? `${formatTime(st.start_time)} – ${formatTime(st.end_time)}` : '—',
    };
  });

  const columns: Column<CGRow>[] = [
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
    { key: 'sectionName', header: 'Section', sortable: true, render: (v) => <span className="badge-green">{String(v)}</span> },
    { key: 'teacherName', header: 'Teacher', sortable: true },
    { key: 'subjectName', header: 'Subject', sortable: true },
    { key: 'roomName', header: 'Room', sortable: true },
    { key: 'day', header: 'Day', render: (v) => <span className="badge-blue">{DAY_LABELS[v as number] ?? '—'}</span> },
    { key: 'timeSlot', header: 'Time', render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
  ];

  const tsOptions = teacherSubjects.map((ts) => {
    const teacher = teachers.find((t) => t.id === ts.teacher_id);
    const subject = subjects.find((s) => s.id === ts.subject_id);
    return { value: String(ts.id!), label: `${teacher?.first_name} ${teacher?.last_name} → ${subject?.name}` };
  });

  const rsOptions = roomSchedules.map((rs) => {
    const room = rooms.find((r) => r.id === rs.room_id);
    const sched = schedules.find((s) => s.id === rs.schedule_id);
    return { value: String(rs.id!), label: `${room?.name} — ${sched?.day} ${sched ? formatTime(sched.start_time) : ''}` };
  });

  const sectionOptions = sections.map((s) => ({ value: String(s.id!), label: `${s.name} (${s.code})` }));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassGroupInput>({
    resolver: zodResolver(classGroupSchema.omit({ id: true })),
  });

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (row: CGRow) => {
    setEditing(row);
    reset({ teacher_subject_id: row.teacher_subject_id, room_schedule_id: row.room_schedule_id, section_id: row.section_id });
    setModalOpen(true);
  };

  const onSubmit = async (values: ClassGroupInput) => {
    if (editing?.id) await updateCG.mutateAsync({ id: editing.id, data: values });
    else await createCG.mutateAsync(values);
    setModalOpen(false);
    reset({});
  };

  // ── Generate modal content ────────────────────────────────────────────────
  const { step, progress, message, result, committed, failed, errors: commitErrors, error: solverError } = scheduler.state;

  return (
    <>
      <PageHeader title="Class Groups" description="Assign teacher-subjects to room schedules and sections" icon={<GraduationCap className="w-5 h-5" />}
        actions={
          <>
            {selectedIds.size > 0 && (
              <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setBulkDeleteOpen(true)}>
                Delete ({selectedIds.size})
              </Button>
            )}
            <Button variant="secondary" size="sm" icon={<Wand2 className="w-3.5 h-3.5" />} onClick={openGenerate}>
              Auto-Generate
            </Button>
            <Link href="/class-groups/create">
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Add Class Group</Button>
            </Link>
          </>
        }
      />
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}
      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><img src="/images/domi.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse" />Loading class groups…</div>
          : <DataTable
              data={rows as unknown as Record<string, unknown>[]}
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              searchKeys={['sectionName', 'teacherName', 'subjectName', 'roomName'] as never[]}
              pagination={cgData?.pagination}
              onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
              onLimitChange={(l) => { setLimit(l); setPage(1); setSelectedIds(new Set()); }}
              actions={(row) => (
                <>
                  <button className="btn-icon" onClick={() => openEdit(row as unknown as CGRow)}><Pencil className="w-3.5 h-3.5" /></button>
                  <button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as CGRow)}><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            />}
      </div>

      {/* ── Manual create/edit modal ── */}
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

      {/* ── Auto-Generate modal ── */}
      <Modal open={generateOpen} onClose={closeGenerate} title="Auto-Generate Schedule" size="full">
        {/* Step: configure */}
        {step === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#616161' }}>
              Select the sections to include. The solver will assign each section's subjects to time slots and rooms automatically.
            </p>

            <div className="flex items-center justify-between text-xs" style={{ color: '#9e9e9e' }}>
              <span>{selectedSections.size} of {sectionsWithSubjects.length} sections selected</span>
              <div className="flex gap-3">
                <button className="hover:underline" style={{ color: '#e91e8c' }}
                  onClick={() => setSelectedSections(new Set(sectionsWithSubjects.map((s) => s.id!)))}>
                  Select all
                </button>
                <button className="hover:underline" style={{ color: '#9e9e9e' }}
                  onClick={() => setSelectedSections(new Set())}>
                  Clear
                </button>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden" style={{ border: '1.5px solid #e0e0e0' }}>
              {sectionsWithSubjects.length === 0 ? (
                <p className="text-center py-6 text-xs" style={{ color: '#9e9e9e' }}>No sections with assigned subjects found.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {sectionsWithSubjects.map((s) => {
                    const count = sectionSubjects.filter((ss) => ss.section_id === s.id).length;
                    const checked = selectedSections.has(s.id!);
                    return (
                      <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors"
                        style={{ borderBottom: '1px solid #f5f5f5', borderRight: '1px solid #f5f5f5', background: checked ? '#fdf2f8' : '#fff' }}>
                        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5 shrink-0"
                          checked={checked}
                          onChange={() => setSelectedSections((prev) => {
                            const n = new Set(prev);
                            n.has(s.id!) ? n.delete(s.id!) : n.add(s.id!);
                            return n;
                          })} />
                        <span className="flex-1 font-medium truncate">{s.name}</span>
                        <span className="badge-blue font-mono text-xs shrink-0">{count}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={closeGenerate}>Cancel</Button>
              <Button icon={<Wand2 className="w-3.5 h-3.5" />} onClick={onGenerate} disabled={selectedSections.size === 0}>
                Generate
              </Button>
            </div>
          </div>
        )}

        {/* Step: solving */}
        {step === 'solving' && (
          <div className="space-y-5 py-4">
            <div className="flex items-center justify-center">
              <img src="/images/domi.png" alt="Solving" className="w-16 h-16 object-contain animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono" style={{ color: '#616161' }}>
                <span>{message || 'Working…'}</span>
                <span>{progress}%</span>
              </div>
              <div className="rounded-full overflow-hidden h-2" style={{ background: '#f5f5f5' }}>
                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#e91e8c' }} />
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: '#bdbdbd' }}>This may take up to a minute…</p>
          </div>
        )}

        {/* Step: review results */}
        {step === 'review' && (
          <div className="flex flex-col h-full gap-4">
            <div className="flex items-center gap-2 text-sm font-medium shrink-0" style={{ color: '#2e7d32' }}>
              <CheckCircle2 className="w-4 h-4" />
              {result.length} class group{result.length !== 1 ? 's' : ''} proposed
            </div>

            <div className="flex-1 rounded-lg overflow-hidden flex flex-col min-h-0" style={{ border: '1.5px solid #e0e0e0' }}>
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide sticky top-0" style={{ color: '#9e9e9e', background: '#fafafa' }}>Section</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide sticky top-0" style={{ color: '#9e9e9e', background: '#fafafa' }}>Teacher</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide sticky top-0" style={{ color: '#9e9e9e', background: '#fafafa' }}>Subject</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide sticky top-0" style={{ color: '#9e9e9e', background: '#fafafa' }}>Room</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide sticky top-0" style={{ color: '#9e9e9e', background: '#fafafa' }}>Day / Time</th>
                  </tr>
                </thead>
              </table>
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    {result.map((cg, i) => {
                      const ts = teacherSubjects.find((x) => x.id === cg.teacher_subject_id);
                      const rs = roomSchedules.find((x) => x.id === cg.room_schedule_id);
                      const section = sections.find((x) => x.id === cg.section_id);
                      const teacher = teachers.find((x) => x.id === ts?.teacher_id);
                      const subject = subjects.find((x) => x.id === ts?.subject_id);
                      const room = rs?.room ?? rooms.find((x) => x.id === rs?.room_id);
                      const st = rs?.schedule?.scheduleTimes?.find((t) => t.id === cg.schedule_time_id);

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td className="px-4 py-2.5">
                            <span className="badge-green">{section?.name ?? cg.section_id}</span>
                          </td>
                          <td className="px-4 py-2.5" style={{ color: '#333' }}>
                            {teacher ? `${teacher.first_name} ${teacher.last_name}` : '—'}
                          </td>
                          <td className="px-4 py-2.5" style={{ color: '#333' }}>{subject?.name ?? '—'}</td>
                          <td className="px-4 py-2.5" style={{ color: '#333' }}>{room?.name ?? '—'}</td>
                          <td className="px-4 py-2.5 font-mono">
                            {st ? `${DAY_LABELS[st.day] ?? st.day} ${formatTime(st.start_time)}–${formatTime(st.end_time)}` : `slot #${cg.schedule_time_id}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 shrink-0">
              <Button variant="secondary" type="button" onClick={closeGenerate}>Discard</Button>
              <Button icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => scheduler.commit()}>
                Commit to Schedule
              </Button>
            </div>
          </div>
        )}

        {/* Step: committing */}
        {step === 'committing' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <img src="/images/domi.png" alt="Saving" className="w-14 h-14 object-contain animate-pulse" />
            <p className="text-sm" style={{ color: '#616161' }}>Saving class groups…</p>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#2e7d32' }}>
              <CheckCircle2 className="w-4 h-4" />
              {committed} class group{committed !== 1 ? 's' : ''} saved successfully
            </div>
            {failed > 0 && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082' }}>
                <div className="flex items-center gap-1.5 font-medium mb-1"><AlertCircle className="w-3.5 h-3.5" />{failed} failed</div>
                {commitErrors.slice(0, 5).map((e, i) => <div key={i} className="font-mono truncate">{e}</div>)}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={closeGenerate}>Done</Button>
            </div>
          </div>
        )}

        {/* Step: error */}
        {step === 'error' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#c62828' }}>
              <XCircle className="w-4 h-4" />
              Solver error
            </div>
            <div className="rounded-lg px-3 py-2 text-xs font-mono" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>
              {solverError}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeGenerate}>Close</Button>
              <Button onClick={() => { scheduler.reset(); }}>Try again</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deleteCG.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteCG.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message={`Delete class group for section "${deleteTarget?.sectionName}"?`}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        loading={deleteCG.isPending}
        onConfirm={() => { Array.from(selectedIds).forEach((id) => deleteCG.mutate(id)); setSelectedIds(new Set()); setBulkDeleteOpen(false); }}
        message={`Delete ${selectedIds.size} selected class group${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`}
      />
    </>
  );
}
