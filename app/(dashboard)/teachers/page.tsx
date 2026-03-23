'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teacherSchema, type Teacher, type TeacherInput } from '@/lib/schemas';
import {
  useTeachers, useCreateTeacher, useUpdateTeacher,
  useDeleteTeacher, useBulkCreateTeachers,
} from '@/hooks/useTeachers';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { MassUpload } from '@/components/tables/MassUpload';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Users, Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { downloadCSV } from '@/lib/utils';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'teacher_code', header: 'Code', sortable: true, width: '110px', render: (v) => <span className="badge-blue font-mono">{String(v)}</span> },
  { key: 'first_name', header: 'First Name', sortable: true },
  { key: 'middle_name', header: 'Middle Name', render: (v) => String(v || '—') },
  { key: 'last_name', header: 'Last Name', sortable: true },
  { key: 'email', header: 'Email', render: (v) => <span className="font-mono text-xs text-ink-500">{String(v)}</span> },
];

export default function TeachersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const { data, isLoading, error } = useTeachers({ page, limit });
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const bulkCreate = useBulkCreateTeachers();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeacherInput>({
    resolver: zodResolver(teacherSchema.omit({ id: true })),
  });

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (t: Teacher) => { setEditing(t); reset(t); setModalOpen(true); };

  const onSubmit = async (values: TeacherInput) => {
    if (editing?.id) await updateTeacher.mutateAsync({ id: editing.id, data: values });
    else await createTeacher.mutateAsync(values);
    setModalOpen(false);
    reset({});
  };

  const parseRow = (row: Record<string, string>): TeacherInput | null => {
    const result = teacherSchema.omit({ id: true }).safeParse({
      first_name: row.first_name?.trim(),
      middle_name: row.middle_name?.trim() ?? '',
      last_name: row.last_name?.trim(),
      email: row.email?.trim(),
      teacher_code: row.teacher_code?.trim(),
    });
    return result.success ? result.data : null;
  };

  return (
    <>
      <PageHeader
        title="Teachers"
        description="Manage teacher records and assignments"
        icon={<Users className="w-5 h-5" />}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => downloadCSV(data?.data ?? [], 'teachers.csv')}>Export</Button>
            <Button variant="secondary" size="sm" icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => setUploadOpen(true)}>Mass Upload</Button>
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Teacher</Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>
          {(error as Error).message}
        </div>
      )}

      <div className="card p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-ink-400">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#e91e8c', borderTopColor: 'transparent' }} />
            Loading teachers…
          </div>
        ) : (
          <DataTable
            data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
            columns={columns}
            searchKeys={['first_name', 'last_name', 'email', 'teacher_code'] as never[]}
            pagination={data?.pagination}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            actions={(row) => (
              <>
                <button className="btn-icon" onClick={() => openEdit(row as unknown as Teacher)}><Pencil className="w-3.5 h-3.5" /></button>
                <button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as Teacher)}><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            )}
          />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="First Name" error={errors.first_name?.message}  {...register('first_name')} />
            <TextField label="Middle Name" error={errors.middle_name?.message} {...register('middle_name')} />
          </div>
          <TextField label="Last Name" error={errors.last_name?.message}    {...register('last_name')} />
          <TextField label="Email" type="email" error={errors.email?.message}  {...register('email')} />
          <TextField label="Teacher Code" error={errors.teacher_code?.message} {...register('teacher_code')} hint="E.g. TC001" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createTeacher.isPending || updateTeacher.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget?.id) deleteTeacher.mutate(deleteTarget.id); setDeleteTarget(null); }}
        loading={deleteTeacher.isPending}
        message={`Delete teacher "${deleteTarget?.first_name} ${deleteTarget?.last_name}"?`}
      />

      <MassUpload<TeacherInput>
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(rows) => bulkCreate.mutate(rows)}
        templateFields={['first_name', 'middle_name', 'last_name', 'email', 'teacher_code']}
        entityName="Teachers"
        parseRow={parseRow}
      />
    </>
  );
}
