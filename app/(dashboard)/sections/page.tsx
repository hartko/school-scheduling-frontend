'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sectionSchema, type Section, type SectionInput } from '@/lib/schemas';
import { useSections, useCreateSection, useUpdateSection, useDeleteSection, useBulkCreateSections } from '@/hooks/useSections';
import { useSectionSubjects, useAllSectionSubjects, useBulkAssignSectionSubjects } from '@/hooks/useSectionSubjects';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeacherSubjects } from '@/hooks/useTeacherSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useRoomSchedules } from '@/hooks/useRoomSchedules';
import { useClassGroups } from '@/hooks/useClassGroups';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { MassUpload } from '@/components/tables/MassUpload';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Layers, Plus, Pencil, Trash2, Upload, Download, BookOpen, CalendarDays } from 'lucide-react';
import { downloadCSV } from '@/lib/utils';
import Link from 'next/link';
import type { RoomScheduleDetail } from '@/lib/schemas';
import { WeeklyTimetable, type TimetableEntry, type TimetableSlot } from '@/components/schedule/WeeklyTimetable';

export default function SectionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
  const [editing, setEditing] = useState<Section | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Section | null>(null);
  const [pendingSubjectIds, setPendingSubjectIds] = useState<Set<number>>(new Set());
  const [pendingUnits, setPendingUnits] = useState<Map<number, number>>(new Map());
  const [viewTarget, setViewTarget] = useState<Section | null>(null);
  const [schedTarget, setSchedTarget] = useState<Section | null>(null);

  const { data, isLoading, error } = useSections({ page, limit });
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const bulkCreate = useBulkCreateSections();

  const { data: allSubjectsData } = useSubjects({ limit: 999 });
  const subjects = allSubjectsData?.data ?? [];

  const { data: allSectionSubjectsData } = useAllSectionSubjects();
  const allSectionSubjects = allSectionSubjectsData ?? [];

  const { data: assignedSubjects } = useSectionSubjects(assignTarget?.id ?? null);
  const { data: viewSubjects, isLoading: viewLoading } = useSectionSubjects(viewTarget?.id ?? null);

  const { data: allTSData } = useTeacherSubjects({ limit: 999 });
  const teacherSubjects = allTSData?.data ?? [];

  const { data: allTeachersData } = useTeachers({ limit: 999 });
  const teachers = allTeachersData?.data ?? [];

  const { data: allRSData } = useRoomSchedules({ limit: 999 });
  const roomSchedules = (allRSData?.data ?? []) as unknown as RoomScheduleDetail[];

  const { data: allCGData } = useClassGroups({ limit: 999 });
  const allClassGroups = allCGData?.data ?? [];

  const bulkAssign = useBulkAssignSectionSubjects();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SectionInput>({
    resolver: zodResolver(sectionSchema.omit({ id: true })),
  });

  const currentPageData = data?.data ?? [];

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: '_sel', header: (
        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
          checked={currentPageData.length > 0 && currentPageData.every((r) => selectedIds.has(r.id!))}
          onChange={(e) => setSelectedIds(e.target.checked ? new Set(currentPageData.map((r) => r.id!)) : new Set())} />
      ), width: '40px',
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
    { key: 'code', header: 'Code', sortable: true, width: '120px', render: (v) => <span className="badge-blue font-mono">{String(v)}</span> },
    { key: 'name', header: 'Section Name', sortable: true },
    {
      key: '_subjects', header: 'Subjects',
      render: (_, row) => {
        const assigned = allSectionSubjects.filter((ss) => ss.section_id === Number(row.id));
        if (assigned.length === 0) return <span style={{ color: '#bdbdbd' }} className="text-xs">—</span>;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-1">
              {assigned.slice(0, 4).map((ss) => (
                <span key={ss.id} className="badge-orange font-mono text-xs">
                  {ss.subject.code}{ss.units ? ` (${ss.units}u)` : ''}
                </span>
              ))}
              {assigned.length > 4 && <span className="text-xs" style={{ color: '#9e9e9e' }}>+{assigned.length - 4} more</span>}
            </div>
            <button className="text-xs text-left" style={{ color: '#e91e8c' }}
              onClick={() => setViewTarget(row as unknown as Section)}>
              Show all ({assigned.length})
            </button>
          </div>
        );
      },
    },
    {
      key: '_classes', header: 'Classes',
      render: (_, row) => {
        const count = allClassGroups.filter((cg) => cg.section_id === Number(row.id)).length;
        if (count === 0) return <span style={{ color: '#bdbdbd' }} className="text-xs">—</span>;
        return (
          <button className="text-xs font-medium" style={{ color: '#e91e8c' }}
            onClick={() => setSchedTarget(row as unknown as Section)}>
            {count} class group{count !== 1 ? 's' : ''}
          </button>
        );
      },
    },
  ];

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (s: Section) => { setEditing(s); reset(s); setModalOpen(true); };

  const openAssign = (s: Section) => {
    setAssignTarget(s);
    setPendingSubjectIds(new Set());
  };

  useEffect(() => {
    if (assignedSubjects) {
      setPendingSubjectIds(new Set(assignedSubjects.map((ss) => ss.subject_id)));
      setPendingUnits(new Map(assignedSubjects.filter((ss) => ss.units).map((ss) => [ss.subject_id, ss.units!])));
    }
  }, [assignedSubjects]);

  const onSaveAssign = async () => {
    if (!assignTarget?.id) return;
    const assignments = Array.from(pendingSubjectIds).map((subject_id) => ({
      subject_id,
      units: pendingUnits.get(subject_id),
    }));
    await bulkAssign.mutateAsync({ sectionId: assignTarget.id, assignments });
    setAssignTarget(null);
  };

  const onSubmit = async (values: SectionInput) => {
    if (editing?.id) await updateSection.mutateAsync({ id: editing.id, data: values });
    else await createSection.mutateAsync(values);
    setModalOpen(false); reset({});
  };

  const parseRow = (row: Record<string, string>): SectionInput | null => {
    const r = sectionSchema.omit({ id: true }).safeParse({ name: row.name?.trim(), code: row.code?.trim() });
    return r.success ? r.data : null;
  };

  // Build timetable data for a specific section
  const sectionClassGroups = schedTarget
    ? allClassGroups.filter((cg) => cg.section_id === schedTarget.id)
    : [];

  // All schedule times reachable from this section's class groups (for grid rows)
  const sectionScheduleTimes: TimetableSlot[] = (() => {
    const seen = new Set<number>();
    const result: TimetableSlot[] = [];
    for (const cg of sectionClassGroups) {
      const rs = roomSchedules.find((x) => x.id === cg.room_schedule_id);
      for (const st of rs?.schedule?.scheduleTimes ?? []) {
        if (!seen.has(st.id)) { seen.add(st.id); result.push(st); }
      }
    }
    return result;
  })();

  const sectionTimetableEntries: TimetableEntry[] = sectionClassGroups
    .filter((cg) => cg.schedule_time_id != null)
    .map((cg) => {
      const ts = teacherSubjects.find((x) => x.id === cg.teacher_subject_id);
      const teacher = teachers.find((x) => x.id === ts?.teacher_id);
      const subject = subjects.find((x) => x.id === ts?.subject_id);
      return {
        scheduleTimeId: cg.schedule_time_id!,
        label: subject?.name ?? '—',
        sublabel: teacher ? `${teacher.first_name[0]}. ${teacher.last_name}` : undefined,
        colorKey: String(ts?.subject_id ?? cg.teacher_subject_id),
      };
    });

  return (
    <>
      <PageHeader title="Sections" description="Manage class sections" icon={<Layers className="w-5 h-5" />}
        actions={<>
          {selectedIds.size > 0 && (
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setBulkDeleteOpen(true)}>
              Delete ({selectedIds.size})
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => downloadCSV(data?.data ?? [], 'sections.csv')}>Export</Button>
          <Button variant="secondary" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setUploadOpen(true)}>Mass Upload</Button>
          <Link href="/section-subjects/create">
            <Button variant="secondary" size="sm" icon={<BookOpen className="w-3.5 h-3.5" />}>Assign Subjects</Button>
          </Link>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Section</Button>
        </>}
      />
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}
      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><img src="/images/domi.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse" />Loading sections…</div>
          : <DataTable data={currentPageData as unknown as Record<string, unknown>[]} columns={columns}
              searchKeys={['name', 'code'] as never[]} pagination={data?.pagination}
              onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
              onLimitChange={(l) => { setLimit(l); setPage(1); setSelectedIds(new Set()); }}
              actions={(row) => (
                <>
                  <button className="btn-icon" title="View Schedule" onClick={() => setSchedTarget(row as unknown as Section)}><CalendarDays className="w-3.5 h-3.5" /></button>
                  <button className="btn-icon" title="Assign Subjects" onClick={() => openAssign(row as unknown as Section)}><BookOpen className="w-3.5 h-3.5" /></button>
                  <button className="btn-icon" onClick={() => openEdit(row as unknown as Section)}><Pencil className="w-3.5 h-3.5" /></button>
                  <button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as Section)}><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )} />}
      </div>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Section' : 'Add Section'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField label="Section Name" error={errors.name?.message} {...register('name')} />
          <TextField label="Section Code" error={errors.code?.message} {...register('code')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createSection.isPending || updateSection.isPending}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} loading={deleteSection.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteSection.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message={`Delete section "${deleteTarget?.name}"?`} />
      <ConfirmDialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} loading={deleteSection.isPending}
        onConfirm={() => { Array.from(selectedIds).forEach((id) => deleteSection.mutate(id)); setSelectedIds(new Set()); setBulkDeleteOpen(false); }}
        message={`Delete ${selectedIds.size} selected section${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`} />

      <MassUpload<SectionInput> open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={(rows) => bulkCreate.mutate(rows)}
        templateFields={['name', 'code']} entityName="Sections" parseRow={parseRow} />

      {/* View subjects modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={`Subjects — ${viewTarget?.name ?? ''}`} size="md">
        <div className="space-y-3">
          {viewLoading ? (
            <p className="text-center py-6 text-xs" style={{ color: '#9e9e9e' }}>Loading…</p>
          ) : !viewSubjects?.length ? (
            <p className="text-center py-6 text-xs" style={{ color: '#9e9e9e' }}>No subjects assigned.</p>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ border: '1.5px solid #e0e0e0' }}>
              {viewSubjects.map((ss, i) => (
                <div key={ss.id} className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  style={{ borderBottom: i < viewSubjects.length - 1 ? '1px solid #f5f5f5' : 'none', background: '#fff' }}>
                  <span className="flex-1">{ss.subject.name}</span>
                  <span className="badge-blue font-mono text-xs">{ss.subject.code}</span>
                  {ss.units && <span className="badge-orange font-mono text-xs">{ss.units}u</span>}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs" style={{ color: '#9e9e9e' }}>{viewSubjects?.length ?? 0} subject{viewSubjects?.length !== 1 ? 's' : ''}</span>
            <Button variant="secondary" type="button" onClick={() => setViewTarget(null)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Section timetable modal */}
      <Modal open={!!schedTarget} onClose={() => setSchedTarget(null)} title={`Weekly Schedule — ${schedTarget?.name ?? ''}`} size="xl">
        <div className="space-y-3">
          {sectionClassGroups.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#9e9e9e' }}>No class groups assigned yet.</p>
          ) : (
            <WeeklyTimetable
              scheduleTimes={sectionScheduleTimes}
              entries={sectionTimetableEntries}
            />
          )}
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs" style={{ color: '#9e9e9e' }}>{sectionClassGroups.length} class group{sectionClassGroups.length !== 1 ? 's' : ''}</span>
            <Button variant="secondary" onClick={() => setSchedTarget(null)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Assign subjects modal */}
      <Modal open={!!assignTarget} onClose={() => setAssignTarget(null)} title={`Assign Subjects — ${assignTarget?.name ?? ''}`} size="md">
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#9e9e9e' }}>Select subjects to assign to this section.</p>
          <div className="rounded-lg overflow-hidden max-h-72 overflow-y-auto" style={{ border: '1.5px solid #e0e0e0' }}>
            {subjects.length === 0 ? (
              <p className="text-center py-6 text-xs" style={{ color: '#9e9e9e' }}>No subjects found.</p>
            ) : (
              subjects.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  style={{ borderBottom: '1px solid #f5f5f5', background: pendingSubjectIds.has(s.id!) ? '#fdf2f8' : '#fff' }}>
                  <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5 shrink-0 cursor-pointer"
                    checked={pendingSubjectIds.has(s.id!)}
                    onChange={() => {
                      setPendingSubjectIds((prev) => {
                        const next = new Set(prev);
                        next.has(s.id!) ? next.delete(s.id!) : next.add(s.id!);
                        return next;
                      });
                    }} />
                  <span className="flex-1">{s.name}</span>
                  <span className="font-mono text-xs" style={{ color: '#9e9e9e' }}>{s.code}</span>
                  {pendingSubjectIds.has(s.id!) && (
                    <input type="number" min={1} placeholder="units"
                      value={pendingUnits.get(s.id!) ?? ''}
                      onChange={(e) => setPendingUnits((prev) => {
                        const next = new Map(prev);
                        e.target.value ? next.set(s.id!, Number(e.target.value)) : next.delete(s.id!);
                        return next;
                      })}
                      className="w-16 text-center text-xs border rounded px-1 py-0.5 focus:outline-none"
                      style={{ borderColor: '#f8bbd0', color: '#c2185b' }} />
                  )}
                </div>
              ))
            )}
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs" style={{ color: '#9e9e9e' }}>{pendingSubjectIds.size} selected</span>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setAssignTarget(null)}>Cancel</Button>
              <Button onClick={onSaveAssign} loading={bulkAssign.isPending}>Save</Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
