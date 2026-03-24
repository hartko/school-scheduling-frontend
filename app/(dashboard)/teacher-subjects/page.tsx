'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teacherSubjectSchema, type TeacherSubject, type TeacherSubjectInput } from '@/lib/schemas';
import { useTeacherSubjects, useCreateTeacherSubject, useDeleteTeacherSubject } from '@/hooks/useTeacherSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserCheck, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

// Enriched row type for display
interface TSRow extends Record<string, unknown> {
  id: number;
  teacher_id: number;
  subject_id: number;
  teacherName: string;
  teacherCode: string;
  subjectName: string;
  subjectCode: string;
}

const columns: Column<TSRow>[] = [
  { key: 'teacherCode', header: 'Teacher Code', width: '130px', render: (v) => <span className="badge-blue font-mono">{String(v)}</span> },
  { key: 'teacherName', header: 'Teacher', sortable: true },
  { key: 'subjectCode', header: 'Subject Code', width: '130px', render: (v) => <span className="badge-orange font-mono">{String(v)}</span> },
  { key: 'subjectName', header: 'Subject', sortable: true },
];

export default function TeacherSubjectsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TSRow | null>(null);

  // Fetch all — TanStack Query deduplicates concurrent requests automatically
  const { data: tsData, isLoading, error } = useTeacherSubjects({ page, limit });
  const { data: teachersData } = useTeachers({ limit: 999 }); // all for dropdown
  const { data: subjectsData } = useSubjects({ limit: 999 });

  const createTS = useCreateTeacherSubject();
  const deleteTS = useDeleteTeacherSubject();

  const teachers = teachersData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  // Enrich rows with human-readable names
  const rows: TSRow[] = (tsData?.data ?? []).map((ts) => {
    const teacher = teachers.find((t) => t.id === ts.teacher_id);
    const subject = subjects.find((s) => s.id === ts.subject_id);
    return {
      ...ts,
      id: ts.id!,
      teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : '—',
      teacherCode: teacher?.teacher_code ?? '—',
      subjectName: subject?.name ?? '—',
      subjectCode: subject?.code ?? '—',
    };
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeacherSubjectInput>({
    resolver: zodResolver(teacherSubjectSchema.omit({ id: true })),
  });

  const onSubmit = async (values: TeacherSubjectInput) => {
    await createTS.mutateAsync(values);
    setModalOpen(false);
    reset({});
  };

  return (
    <>
      <PageHeader title="Teacher Subjects" description="Assign subjects to teachers" icon={<UserCheck className="w-5 h-5" />}
        actions={
          <Link href="/teacher-subjects/create">
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Assign Subject</Button>
          </Link>
        }
      />
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}
      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><img src="/images/domi.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse" />Loading…</div>
          : <DataTable
            data={rows as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            searchKeys={['teacherName', 'subjectName', 'teacherCode', 'subjectCode'] as never[]}
            pagination={tsData?.pagination}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            actions={(row) => (
              <button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as TSRow)}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Assign Subject to Teacher">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SelectField
            label="Teacher"
            placeholder="Select a teacher..."
            options={teachers.map((t) => ({ value: String(t.id!), label: `${t.first_name} ${t.last_name} (${t.teacher_code})` }))}
            error={errors.teacher_id?.message}
            {...register('teacher_id')}
          />
          <SelectField
            label="Subject"
            placeholder="Select a subject..."
            options={subjects.map((s) => ({ value: String(s.id!), label: `${s.name} (${s.code})` }))}
            error={errors.subject_id?.message}
            {...register('subject_id')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createTS.isPending}>Assign</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deleteTS.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteTS.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message={`Remove "${deleteTarget?.teacherName}" from "${deleteTarget?.subjectName}"?`}
      />
    </>
  );
}
