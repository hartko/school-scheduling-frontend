'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomSchema, type Room, type RoomInput } from '@/lib/schemas';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, useBulkCreateRooms } from '@/hooks/useRooms';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { MassUpload } from '@/components/tables/MassUpload';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { SelectField } from '@/components/ui/SelectField';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Building2, Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { downloadCSV } from '@/lib/utils';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'name', header: 'Room Name', sortable: true },
  { key: 'capacity', header: 'Capacity', sortable: true, render: (v) => <span className="font-mono text-sm">{String(v)} seats</span> },
  { key: 'level', header: 'Level', sortable: true, render: (v) => <span className="badge-blue">{String(v)}</span> },
];

export default function RoomsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [editing, setEditing] = useState<Room | null>(null);

  const { data, isLoading, error } = useRooms({ page, limit });
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const bulkCreate = useBulkCreateRooms();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomInput>({
    resolver: zodResolver(roomSchema.omit({ id: true }))
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: Room) => { setEditing(r); reset(r); setModalOpen(true); };

  const onSubmit = async (values: RoomInput) => {
    if (editing?.id) await updateRoom.mutateAsync({ id: editing.id, data: values });
    else await createRoom.mutateAsync(values);
    setModalOpen(false); reset({});
  };

  const parseRow = (row: Record<string, string>): RoomInput | null => {
    const r = roomSchema.omit({ id: true }).safeParse({ name: row.name?.trim(), capacity: parseInt(row.capacity, 10), level: row.level?.trim() });
    return r.success ? r.data : null;
  };

  return (
    <>
      <PageHeader title="Rooms" description="Manage classroom and facility records" icon={<Building2 className="w-5 h-5" />}
        actions={<>
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => downloadCSV(data?.data ?? [], 'rooms.csv')}>Export</Button>
          <Button variant="secondary" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setUploadOpen(true)}>Mass Upload</Button>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Room</Button>
        </>}
      />
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}
      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#e91e8c', borderTopColor: 'transparent' }} />Loading rooms…</div>
          : <DataTable data={(data?.data ?? []) as unknown as Record<string, unknown>[]} columns={columns}
            searchKeys={['name', 'level'] as never[]} pagination={data?.meta}
            onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }}
            actions={(row) => (<><button className="btn-icon" onClick={() => openEdit(row as unknown as Room)}><Pencil className="w-3.5 h-3.5" /></button><button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as Room)}><Trash2 className="w-3.5 h-3.5" /></button></>)} />}
      </div>
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
      <MassUpload<RoomInput> open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={(rows) => bulkCreate.mutate(rows)}
        templateFields={['name', 'capacity', 'level']} entityName="Rooms" parseRow={parseRow} />
    </>
  );
}
