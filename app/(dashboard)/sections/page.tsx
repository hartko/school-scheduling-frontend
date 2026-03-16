'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sectionSchema, type Section, type SectionInput } from '@/lib/schemas';
import { useSections, useCreateSection, useUpdateSection, useDeleteSection, useBulkCreateSections } from '@/hooks/useSections';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { MassUpload } from '@/components/tables/MassUpload';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Layers, Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { downloadCSV } from '@/lib/utils';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'code', header: 'Code', sortable: true, width: '120px', render: (v) => <span className="badge-blue font-mono">{String(v)}</span> },
  { key: 'name', header: 'Section Name', sortable: true },
];

export default function SectionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
  const [editing, setEditing] = useState<Section | null>(null);

  const { data, isLoading, error } = useSections({ page, limit });
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const bulkCreate = useBulkCreateSections();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SectionInput>({
    resolver: zodResolver(sectionSchema.omit({ id: true })),
  });

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (s: Section) => { setEditing(s); reset(s); setModalOpen(true); };

  const onSubmit = async (values: SectionInput) => {
    if (editing?.id) await updateSection.mutateAsync({ id: editing.id, data: values });
    else await createSection.mutateAsync(values);
    setModalOpen(false); reset({});
  };

  const parseRow = (row: Record<string, string>): SectionInput | null => {
    const r = sectionSchema.omit({ id: true }).safeParse({ name: row.name?.trim(), code: row.code?.trim() });
    return r.success ? r.data : null;
  };

  return (
    <>
      <PageHeader title="Sections" description="Manage class sections" icon={<Layers className="w-5 h-5" />}
        actions={<>
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => downloadCSV(data?.data ?? [], 'sections.csv')}>Export</Button>
          <Button variant="secondary" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setUploadOpen(true)}>Mass Upload</Button>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Section</Button>
        </>}
      />
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}
      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#e91e8c', borderTopColor: 'transparent' }} />Loading sections…</div>
          : <DataTable data={(data?.data ?? []) as unknown as Record<string, unknown>[]} columns={columns}
            searchKeys={['name', 'code'] as never[]} pagination={data?.meta}
            onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }}
            actions={(row) => (<><button className="btn-icon" onClick={() => openEdit(row as unknown as Section)}><Pencil className="w-3.5 h-3.5" /></button><button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as Section)}><Trash2 className="w-3.5 h-3.5" /></button></>)} />}
      </div>

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

      <MassUpload<SectionInput> open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={(rows) => bulkCreate.mutate(rows)}
        templateFields={['name', 'code']} entityName="Sections" parseRow={parseRow} />
    </>
  );
}
