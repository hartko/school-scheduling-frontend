'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, ArrowLeft, Pencil, Tag, FileText, Coffee, Plus, Trash2 } from 'lucide-react';
import {
  useScheduleDetail,
  useUpdateSchedule,
  useCreateScheduleTime,
  useUpdateScheduleTime,
  useDeleteScheduleTime,
} from '@/hooks/useSchedules';
import { useDynamicBreadcrumb } from '@/context/BreadcrumbContext';
import {
  DAY_LABELS,
  scheduleFormSchema,
  scheduleTimeFormSchema,
  type ScheduleFormInput,
  type ScheduleTime,
  type ScheduleTimeFormInput,
} from '@/lib/schemas';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingState, ErrorState } from '@/components/ui/StateViews';
import { formatTime } from '@/lib/utils';

const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6];

function groupByDay(times: ScheduleTime[]): Record<number, ScheduleTime[]> {
  return times.reduce<Record<number, ScheduleTime[]>>((acc, t) => {
    if (!acc[t.day]) acc[t.day] = [];
    acc[t.day].push(t);
    return acc;
  }, {});
}

export default function ScheduleShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const scheduleId = Number(id);

  const { data: schedule, isLoading, error, refetch } = useScheduleDetail(scheduleId);
  useDynamicBreadcrumb(id, schedule?.name);
  const updateSchedule = useUpdateSchedule();
  const createTime = useCreateScheduleTime(scheduleId);
  const updateTime = useUpdateScheduleTime(scheduleId);
  const deleteTime = useDeleteScheduleTime(scheduleId);

  // ── Info edit modal ──────────────────────────────────────────────────────────
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const infoForm = useForm<ScheduleFormInput>({
    resolver: zodResolver(scheduleFormSchema),
  });

  useEffect(() => {
    if (infoModalOpen && schedule) {
      infoForm.reset({
        name: schedule.name,
        schedule_code: schedule.schedule_code ?? '',
        description: schedule.description ?? '',
      });
    }
  }, [infoModalOpen, schedule]); // eslint-disable-line react-hooks/exhaustive-deps

  const onInfoSubmit = async (values: ScheduleFormInput) => {
    await updateSchedule.mutateAsync({ id: scheduleId, data: values as never });
    setInfoModalOpen(false);
  };

  // ── Time slot modal ──────────────────────────────────────────────────────────
  const [activeDay, setActiveDay] = useState<number>(0);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<ScheduleTime | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleTime | null>(null);

  const timeForm = useForm<ScheduleTimeFormInput>({
    resolver: zodResolver(scheduleTimeFormSchema),
    defaultValues: { is_break: false, day: 0 },
  });

  useEffect(() => {
    if (timeModalOpen) {
      if (editingTime) {
        timeForm.reset({
          start_time: editingTime.start_time,
          end_time: editingTime.end_time,
          is_break: editingTime.is_break,
          day: editingTime.day,
        });
      } else {
        timeForm.reset({ start_time: '', end_time: '', is_break: false, day: currentDay });
      }
    }
  }, [timeModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTimeSubmit = async (values: ScheduleTimeFormInput) => {
    if (editingTime) {
      await updateTime.mutateAsync({ id: editingTime.id, data: values });
    } else {
      await createTime.mutateAsync(values);
    }
    setTimeModalOpen(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (isLoading) return <LoadingState message="Loading schedule…" />;
  if (error || !schedule) return <ErrorState message={(error as Error)?.message ?? 'Schedule not found'} onRetry={refetch} />;

  const grouped = groupByDay(schedule.scheduleTimes ?? []);
  const availableDays = DAY_ORDER.filter((d) => grouped[d]?.length);
  const currentDay = availableDays.includes(activeDay) ? activeDay : availableDays[0] ?? 0;
  const times = (grouped[currentDay] ?? []).slice().sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <>
      <PageHeader
        title={schedule.name}
        description={schedule.description || 'No description'}
        icon={<Clock className="w-5 h-5" />}
        actions={
          <>
            <Link href="/schedules">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
            </Link>
            <Button size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setInfoModalOpen(true)}>
              Edit Info
            </Button>
          </>
        }
      />

      {/* ── Info card ─────────────────────────────────────────────────────────── */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f3e5f5' }}>
              <Tag className="w-4 h-4" style={{ color: '#8e24aa' }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#9e9e9e' }}>Schedule Code</p>
              <p className="font-mono text-sm font-semibold mt-0.5">{schedule.schedule_code || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#e3f2fd' }}>
              <FileText className="w-4 h-4" style={{ color: '#1976d2' }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#9e9e9e' }}>Description</p>
              <p className="text-sm mt-0.5" style={{ color: '#424242' }}>{schedule.description || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#e8f5e9' }}>
              <Clock className="w-4 h-4" style={{ color: '#2e7d32' }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#9e9e9e' }}>Total Slots</p>
              <p className="font-mono text-sm font-semibold mt-0.5">{schedule.scheduleTimes?.length ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Schedule Times ────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: '#333' }}>Schedule Times</h2>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setEditingTime(null); setTimeModalOpen(true); }}>
            Add Time
          </Button>
        </div>

        {availableDays.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-5 border-b" style={{ borderColor: '#e0e0e0' }}>
            {availableDays.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className="px-6 py-3.5 text-base font-medium transition-colors"
                style={{
                  borderBottom: currentDay === day ? '2px solid #e91e8c' : '2px solid transparent',
                  color: currentDay === day ? '#e91e8c' : '#757575',
                  marginBottom: '-1px',
                }}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        )}

        {times.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <p className="text-sm" style={{ color: '#9e9e9e' }}>No time slots yet.</p>
            <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setEditingTime(null); setTimeModalOpen(true); }}>
              Add first slot
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {times.map((t) => {
                  const [sh, sm] = t.start_time.split(':').map(Number);
                  const [eh, em] = t.end_time.split(':').map(Number);
                  const duration = (eh * 60 + em) - (sh * 60 + sm);
                  return (
                    <tr key={t.id}>
                      <td className="font-mono font-medium">{formatTime(t.start_time)}</td>
                      <td className="font-mono font-medium">{formatTime(t.end_time)}</td>
                      <td className="font-mono text-xs" style={{ color: '#757575' }}>{duration} min</td>
                      <td>
                        {t.is_break ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fff8e1', color: '#f57f17' }}>
                            <Coffee className="w-3 h-3" /> Break
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                            <Clock className="w-3 h-3" /> Class
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn-icon" title="Edit" style={{ color: '#b8b217' }} onClick={() => { setEditingTime(t); setTimeModalOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button className="btn-icon" title="Delete" style={{ color: '#ef5350' }} onClick={() => setDeleteTarget(t)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Info Modal ───────────────────────────────────────────────────── */}
      <Modal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="Edit Schedule Info" size="sm">
        <form onSubmit={infoForm.handleSubmit(onInfoSubmit)} className="space-y-4">
          <TextField
            label="Schedule Name"
            error={infoForm.formState.errors.name?.message}
            {...infoForm.register('name')}
          />
          <TextField
            label="Schedule Code"
            hint="Optional unique identifier"
            error={infoForm.formState.errors.schedule_code?.message}
            {...infoForm.register('schedule_code')}
          />
          <TextField
            label="Description"
            error={infoForm.formState.errors.description?.message}
            {...infoForm.register('description')}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setInfoModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={updateSchedule.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* ── Time Slot Modal ───────────────────────────────────────────────────── */}
      <Modal open={timeModalOpen} onClose={() => setTimeModalOpen(false)} title={editingTime ? 'Edit Time Slot' : 'Add Time Slot'} size="sm">
        <form onSubmit={timeForm.handleSubmit(onTimeSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Start Time" type="time" error={timeForm.formState.errors.start_time?.message} {...timeForm.register('start_time')} />
            <TextField label="End Time" type="time" error={timeForm.formState.errors.end_time?.message} {...timeForm.register('end_time')} />
          </div>
          <div>
            <label className="form-label">Day</label>
            <select className="form-input mt-0.5" {...timeForm.register('day')}>
              {DAY_ORDER.map((d) => (
                <option key={d} value={d}>{DAY_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <CheckboxField label="Break Period" {...timeForm.register('is_break')} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setTimeModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createTime.isPending || updateTime.isPending}>
              {editingTime ? 'Save' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deleteTime.isPending}
        message={`Delete the ${deleteTarget?.start_time}–${deleteTarget?.end_time} slot?`}
        onConfirm={() => {
          if (deleteTarget) deleteTime.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </>
  );
}
