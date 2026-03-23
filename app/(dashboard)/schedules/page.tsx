'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleBaseSchema, scheduleSchema, type Schedule, type ScheduleInput, DAY_LABELS } from '@/lib/schemas';
import { useSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule, useBulkCreateSchedules } from '@/hooks/useSchedules';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { MassUpload } from '@/components/tables/MassUpload';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { CheckboxField  } from '@/components/ui/CheckboxField';
import {SelectField} from '@/components/ui/SelectField';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Clock, Plus, Pencil, Trash2, Upload, Download, Eye } from 'lucide-react';
import { downloadCSV, formatTime } from '@/lib/utils';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'name', header: 'Name', sortable: true, render: (v) => <span className="font-mono text-sm">{String(v)}</span> },
  { key: 'description', header: 'Description', sortable: true, render: (v) => <span className="font-mono text-sm">{String(v)}</span> },
];

export default function SchedulesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const { data, isLoading, error } = useSchedules({ page, limit });
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const bulkCreate = useBulkCreateSchedules();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleBaseSchema.omit({ id: true })),
    defaultValues: { is_break: false, day: 1 },
  });

  const openCreate = () => { setEditing(null); reset({ is_break: false, day: 1 }); setModalOpen(true); };
  const openEdit = (s: Schedule) => { setEditing(s); reset(s); setModalOpen(true); };

  const onSubmit = async (values: ScheduleInput) => {
    if (editing?.id) await updateSchedule.mutateAsync({ id: editing.id, data: values });
    else await createSchedule.mutateAsync(values);
    setModalOpen(false);
  };

  const parseRow = (row: Record<string, string>): ScheduleInput | null => {
    const r = scheduleSchema.safeParse({
      name: row.name?.trim(),
      description: row.description?.trim(),
      start_time: row.start_time?.trim(),
      end_time: row.end_time?.trim(),
      is_break: row.is_break?.toLowerCase() === 'true',
      day: row.day?.trim(),
    });
    return r.success ? r.data : null;
  };

  return (
    <>
      <PageHeader title="Schedules" description="Manage time slots and break periods" icon={<Clock className="w-5 h-5" />}
        actions={<>
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => downloadCSV(data?.data ?? [], 'schedules.csv')}>Export</Button>
          <Button variant="secondary" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setUploadOpen(true)}>Mass Upload</Button>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>Add Schedule</Button>
        </>}
      />
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>{(error as Error).message}</div>}
      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#e91e8c', borderTopColor: 'transparent' }} />Loading schedules…</div>
          : <DataTable data={(data?.data ?? []) as unknown as Record<string, unknown>[]} columns={columns}
            searchKeys={['day'] as never[]} pagination={data?.pagination}
            onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }}
            actions={(row) => (
            <><button className="btn-icon" onClick={() => {}}><Eye className="w-5 h-5" style={{ color: '#2f64d6' }} /></button>
            <button className="btn-icon" style={{color:'#b8b217'}} onClick={() => openEdit(row as unknown as Schedule)}><Pencil className="w-5 h-5" /></button>
            <button className="btn-icon" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(row as unknown as Schedule)}><Trash2 className="w-5 h-5" /></button></>)} />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Schedule' : 'Add Schedule'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SelectField label="Day" options={Object.entries(DAY_LABELS).map(([value, label]) => ({ value: String(value), label }))} error={errors.day?.message} {...register('day')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Start Time" type="time" error={errors.start_time?.message} {...register('start_time')} />
            <TextField label="End Time" type="time" error={errors.end_time?.message}   {...register('end_time')} />
          </div>
          <CheckboxField label="Is Break Period" {...register('is_break')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createSchedule.isPending || updateSchedule.isPending}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} loading={deleteSchedule.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteSchedule.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message="Delete this schedule slot?" />

      <MassUpload<ScheduleInput> open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={(rows) => bulkCreate.mutate(rows)}
        templateFields={['day', 'start_time', 'end_time', 'is_break']} entityName="Schedules" parseRow={parseRow} />
    </>
  );
}
