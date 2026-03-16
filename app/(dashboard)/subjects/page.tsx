'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectSchema, type Subject, type SubjectInput } from '@/lib/schemas';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, useBulkCreateSubjects } from '@/hooks/useSubjects';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { MassUpload } from '@/components/tables/MassUpload';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BookOpen, Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { downloadCSV } from '@/lib/utils';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'code', header: 'Code', sortable: true, width: '130px', render: (v) => <span className="badge-orange font-mono">{String(v)}</span> },
  { key: 'name', header: 'Subject Name', sortable: true },
];

export default function SubjectsPage() {
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen]       = useState(false);
  const [uploadOpen, setUploadOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [editing, setEditing]           = useState<Subject | null>(null);

  const { data, isLoading, error } = useSubjects({ page, limit });
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const bulkCreate    = useBulkCreateSubjects();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema.omit({ id: true })),
  });

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit   = (s: Subject) => { setEditing(s); reset(s); setModalOpen(true); };

  const onSubmit = async (values: SubjectInput) => {
    if (editing?.id) await updateSubject.mutateAsync({ id: editing.id, data: values });
    else             await createSubject.mutateAsync(values);
    setModalOpen(false); reset({});
  };

  const parseRow = (row: Record<string, string>): SubjectInput | null => {
    const r = subjectSchema.omit({ id: true }).safeParse({ name: row.name?.trim(), code: row.code?.trim() });
    return r.success ? r.data : null;
  };

  return (
    <>
      <PageHeader title="Subjects" description="Manage curriculum subjects" icon={<BookOpen className="w-5 h-5" />}
        actions={<>
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => downloadCSV(data?.data ?? [], 'subjects.csv')}>Export</Button>
          <Button variant="secondary" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setUploadOpen(true)}>Mass Upload</Button>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Subject</Button>
        </>}
      />
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}
      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#e91e8c', borderTopColor: 'transparent' }} />Loading subjects…</div>
          : <DataTable data={(data?.data ?? []) as unknown as Record<string, unknown>[]} columns={columns}
              searchKeys={['name', 'code'] as never[]} pagination={data?.pagination}
              onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }}
              actions={(row) => (<><button className="btn-icon" onClick={() => openEdit(row as unknown as Subject)}><Pencil className="w-3.5 h-3.5" /></button><button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as Subject)}><Trash2 className="w-3.5 h-3.5" /></button></>)} />}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField label="Subject Name" error={errors.name?.message} {...register('name')} />
          <TextField label="Subject Code" error={errors.code?.message} {...register('code')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createSubject.isPending || updateSubject.isPending}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} loading={deleteSubject.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteSubject.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message={`Delete subject "${deleteTarget?.name}"?`} />
      <MassUpload<SubjectInput> open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={(rows) => bulkCreate.mutate(rows)}
        templateFields={['name', 'code']} entityName="Subjects" parseRow={parseRow} />
    </>
  );
}
