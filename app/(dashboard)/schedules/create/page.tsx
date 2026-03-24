'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleFormSchema, scheduleTimeFormSchema, DAY_LABELS, type ScheduleFormInput, type ScheduleTimeFormInput } from '@/lib/schemas';
import { useCreateSchedule } from '@/hooks/useSchedules';
import { scheduleTimesApi } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { TextField } from '@/components/ui/TextField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { Button } from '@/components/ui/Button';
import { Clock, ArrowLeft, Plus, Trash2, Coffee, X } from 'lucide-react';
import Link from 'next/link';
import { formatTime } from '@/lib/utils';

const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6];

export default function ScheduleCreatePage() {
  const router = useRouter();
  const createSchedule = useCreateSchedule();

  // ── Schedule info form ───────────────────────────────────────────────────────
  const { register, handleSubmit, formState: { errors } } = useForm<ScheduleFormInput>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: { name: '', schedule_code: '', description: '' },
  });

  // ── Time slots ───────────────────────────────────────────────────────────────
  const [timeSlots, setTimeSlots] = useState<ScheduleTimeFormInput[]>([]);
  const [showInlineForm, setShowInlineForm] = useState(false);

  const timeForm = useForm<ScheduleTimeFormInput>({
    resolver: zodResolver(scheduleTimeFormSchema),
    defaultValues: { start_time: '', end_time: '', is_break: false, day: 0 },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const onAddTime = (values: ScheduleTimeFormInput) => {
    setTimeSlots((prev) => [...prev, values]);
    timeForm.reset({ start_time: '', end_time: '', is_break: false, day: values.day });
  };

  const removeSlot = (index: number) => setTimeSlots((prev) => prev.filter((_, i) => i !== index));

  // ── Submit ───────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (values: ScheduleFormInput) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const schedule = await createSchedule.mutateAsync(values);
      if (timeSlots.length > 0) {
        await Promise.all(timeSlots.map((t) => scheduleTimesApi.create(schedule.id!, t)));
      }
      router.push(`/schedules/${schedule.id}/show`);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };


  return (
    <>
      <PageHeader
        title="New Schedule"
        description="Create a schedule and add its time slots"
        icon={<Clock className="w-5 h-5" />}
        actions={
          <Link href="/schedules">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Schedule Info ────────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: '#333' }}>Schedule Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextField
              label="Schedule Name"
              placeholder="e.g. Regular Schedule"
              error={errors.name?.message}
              {...register('name')}
            />
            <TextField
              label="Schedule Code"
              placeholder="e.g. SC-001"
              hint="Optional unique identifier"
              error={errors.schedule_code?.message}
              {...register('schedule_code')}
            />
            <TextField
              label="Description"
              placeholder="Brief description"
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
        </div>

        {/* ── Time Slots ──────────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#333' }}>Time Slots</h2>
              <p className="text-xs mt-0.5" style={{ color: '#9e9e9e' }}>
                {timeSlots.length === 0 ? 'Optional — you can add them later too.' : `${timeSlots.length} slot${timeSlots.length > 1 ? 's' : ''} added`}
              </p>
            </div>
          </div>

          <table className="w-full text-sm table-fixed" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '22%' }}>Start</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '22%' }}>End</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '22%' }}>Day</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '22%' }}>Type</th>
                <th style={{ width: '12%' }} />
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, i) => {
                const [sh, sm] = slot.start_time.split(':').map(Number);
                const [eh, em] = slot.end_time.split(':').map(Number);
                const duration = (eh * 60 + em) - (sh * 60 + sm);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td className="px-4 py-2.5 font-mono font-medium whitespace-nowrap">{formatTime(slot.start_time)}</td>
                    <td className="px-4 py-2.5 font-mono font-medium whitespace-nowrap">{formatTime(slot.end_time)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="text-xs">{DAY_LABELS[slot.day]}</span>
                      <span className="text-xs ml-2" style={{ color: '#9e9e9e' }}>{duration} min</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {slot.is_break ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fff8e1', color: '#f57f17' }}>
                          <Coffee className="w-3 h-3" /> Break
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                          <Clock className="w-3 h-3" /> Class
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" className="btn-icon" style={{ color: '#ef5350' }} onClick={() => removeSlot(i)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Inline add row */}
              {showInlineForm && (
                <tr style={{ background: '#fdf2f8', borderBottom: '1px solid #f8bbd0' }}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="flex items-center gap-8">
                      <input type="time" className={`form-input flex-1 text-sm${timeForm.formState.errors.start_time ? ' error' : ''}`} {...timeForm.register('start_time')} />
                      <span className="text-xs font-medium shrink-0" style={{ color: '#9e9e9e' }}>to</span>
                      <input type="time" className={`form-input flex-1 text-sm${timeForm.formState.errors.end_time ? ' error' : ''}`} {...timeForm.register('end_time')} />
                      <select className="form-input flex-1 text-sm" {...timeForm.register('day')}>
                        {DAY_ORDER.map((d) => (
                          <option key={d} value={d}>{DAY_LABELS[d]}</option>
                        ))}
                      </select>
                      <div className="shrink-0 px-4 py-2 rounded-lg" style={{ border: '1.5px solid #e0e0e0', background: '#fff' }}>
                        <CheckboxField label="Break Period" {...timeForm.register('is_break')} />
                      </div>
                      <Button type="button" size="sm" icon={<Plus className="w-3.5 h-3.5" />} className="shrink-0 justify-center" onClick={timeForm.handleSubmit(onAddTime)}>Add Slot</Button>
                      <button type="button" className="btn-icon shrink-0" style={{ color: '#9e9e9e' }} onClick={() => { setShowInlineForm(false); timeForm.reset(); }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Add slot trigger row */}
              {!showInlineForm && (
                <tr>
                  <td colSpan={5} className="px-4 py-3">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                      style={{ color: '#e91e8c' }}
                      onClick={() => setShowInlineForm(true)}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Slot
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {submitError && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#fce4ec', color: '#c2185b' }}>{submitError}</p>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/schedules">
            <Button variant="secondary" type="button">Cancel</Button>
          </Link>
          <Button type="submit" loading={submitting}>Create Schedule</Button>
        </div>
      </form>
    </>
  );
}
