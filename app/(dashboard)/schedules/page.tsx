'use client';

import { useState } from 'react';
import { useSchedules, useDeleteSchedule, useBulkCreateSchedules } from '@/hooks/useSchedules';
import { scheduleSchema, type Schedule, type ScheduleInput } from '@/lib/schemas';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { MassUpload } from '@/components/tables/MassUpload';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Clock, Plus, Pencil, Trash2, Upload, Download, Eye } from 'lucide-react';
import { downloadCSV } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SchedulesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, error } = useSchedules({ page, limit });
  const deleteSchedule = useDeleteSchedule();
  const bulkCreate = useBulkCreateSchedules();

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
    { key: 'name', header: 'Name', sortable: true, render: (v) => <span className="font-medium">{String(v)}</span> },
    { key: 'schedule_code', header: 'Code', sortable: true, render: (v) => <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#f3e5f5', color: '#8e24aa' }}>{String(v || '—')}</span> },
    { key: 'description', header: 'Description', sortable: false, render: (v) => <span className="text-sm" style={{ color: '#757575' }}>{String(v || '—')}</span> },
  ];

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
      <PageHeader
        title="Schedules"
        description="Manage schedules and their time slots"
        icon={<Clock className="w-5 h-5" />}
        actions={
          <>
            {selectedIds.size > 0 && (
              <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setBulkDeleteOpen(true)}>
                Delete ({selectedIds.size})
              </Button>
            )}
            <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => downloadCSV(data?.data ?? [], 'schedules.csv')}>Export</Button>
            <Button variant="secondary" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setUploadOpen(true)}>Mass Upload</Button>
            <Link href="/schedules/create">
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Add Schedule</Button>
            </Link>
          </>
        }
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f48fb1' }}>
          {(error as Error).message}
        </div>
      )}

      <div className="card p-4">
        {isLoading
          ? <div className="flex items-center justify-center py-16 gap-3 text-ink-400"><img src="/images/domi.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse" />Loading schedules…</div>
          : <DataTable
              data={currentPageData as unknown as Record<string, unknown>[]}
              columns={columns}
              searchKeys={['name', 'schedule_code'] as never[]}
              pagination={data?.pagination}
              onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
              onLimitChange={(l) => { setLimit(l); setPage(1); setSelectedIds(new Set()); }}
              actions={(row) => {
                const s = row as unknown as Schedule;
                return (
                  <>
                    <Link href={`/schedules/${s.id}/show`}>
                      <button className="btn-icon" title="View"><Eye className="w-4 h-4" style={{ color: '#2f64d6' }} /></button>
                    </Link>
                    <button className="btn-icon" title="Edit" style={{ color: '#b8b217' }} onClick={() => router.push(`/schedules/${s.id}/show`)}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="btn-icon" title="Delete" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(s)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                );
              }}
            />
        }
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deleteSchedule.isPending}
        onConfirm={() => { if (deleteTarget?.id) deleteSchedule.mutate(deleteTarget.id); setDeleteTarget(null); }}
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        loading={deleteSchedule.isPending}
        onConfirm={() => { Array.from(selectedIds).forEach((id) => deleteSchedule.mutate(id)); setSelectedIds(new Set()); setBulkDeleteOpen(false); }}
        message={`Delete ${selectedIds.size} selected schedule${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`}
      />

      <MassUpload<ScheduleInput>
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(rows) => bulkCreate.mutate(rows)}
        templateFields={['name', 'schedule_code', 'description']}
        entityName="Schedules"
        parseRow={parseRow}
      />
    </>
  );
}
