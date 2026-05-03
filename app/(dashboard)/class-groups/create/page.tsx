'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateClassGroup } from '@/hooks/useClassGroups';
import { useTeacherSubjects } from '@/hooks/useTeacherSubjects';
import { useRoomSchedules } from '@/hooks/useRoomSchedules';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { useRooms } from '@/hooks/useRooms';
import { useSchedules } from '@/hooks/useSchedules';
import { useSections } from '@/hooks/useSections';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchableSelectField } from '@/components/ui/SearchableSelectField';
import { Button } from '@/components/ui/Button';
import { GraduationCap, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { RoomScheduleDetail } from '@/lib/schemas';

interface PendingRow {
  teacher_subject_id: number;
  room_schedule_id: number;
  section_id: number;
  sectionLabel: string;
  tsLabel: string;
  rsLabel: string;
}

export default function ClassGroupCreatePage() {
  const router = useRouter();
  const createCG = useCreateClassGroup();

  const { data: tsData } = useTeacherSubjects({ limit: 999 });
  const { data: rsData } = useRoomSchedules({ limit: 999 });
  const { data: teachersData } = useTeachers({ limit: 999 });
  const { data: subjectsData } = useSubjects({ limit: 999 });
  const { data: roomsData } = useRooms({ limit: 999 });
  const { data: schedulesData } = useSchedules({ limit: 999 });
  const { data: sectionsData } = useSections({ limit: 999 });

  const teacherSubjects = tsData?.data ?? [];
  const roomSchedules = (rsData?.data ?? []) as unknown as RoomScheduleDetail[];
  const teachers = teachersData?.data ?? [];
  const subjects = subjectsData?.data ?? [];
  const rooms = roomsData?.data ?? [];
  const schedules = schedulesData?.data ?? [];
  const sections = sectionsData?.data ?? [];

  // ── Options ───────────────────────────────────────────────────────────────────
  const tsOptions = teacherSubjects.map((ts) => {
    const teacher = teachers.find((t) => t.id === ts.teacher_id);
    const subject = subjects.find((s) => s.id === ts.subject_id);
    return {
      value: String(ts.id!),
      label: `${teacher ? `${teacher.first_name} ${teacher.last_name}` : '?'} → ${subject?.name ?? '?'}`,
    };
  });

  const rsOptions = roomSchedules.map((rs) => {
    const room = rooms.find((r) => r.id === rs.room_id);
    const sched = schedules.find((s) => s.id === rs.schedule_id);
    return {
      value: String(rs.id!),
      label: `${room?.name ?? rs.room?.name ?? '?'} — ${sched?.name ?? rs.schedule?.name ?? '?'}`,
    };
  });

  const sectionOptions = sections.map((s) => ({
    value: String(s.id!),
    label: `${s.name} (${s.code})`,
  }));

  // ── Pending rows ──────────────────────────────────────────────────────────────
  const [pending, setPending] = useState<PendingRow[]>([]);

  const [sectionId, setSectionId] = useState('');
  const [tsId, setTsId] = useState('');
  const [rsId, setRsId] = useState('');
  const [formError, setFormError] = useState('');

  const onAdd = () => {
    if (!sectionId || !tsId || !rsId) { setFormError('All three fields are required.'); return; }
    const isDuplicate = pending.some(
      (r) => r.section_id === Number(sectionId) && r.teacher_subject_id === Number(tsId) && r.room_schedule_id === Number(rsId)
    );
    if (isDuplicate) { setFormError('This combination is already in the list.'); return; }

    setFormError('');
    setPending((prev) => [
      ...prev,
      {
        teacher_subject_id: Number(tsId),
        room_schedule_id: Number(rsId),
        section_id: Number(sectionId),
        sectionLabel: sectionOptions.find((o) => o.value === sectionId)?.label ?? sectionId,
        tsLabel: tsOptions.find((o) => o.value === tsId)?.label ?? tsId,
        rsLabel: rsOptions.find((o) => o.value === rsId)?.label ?? rsId,
      },
    ]);
    setSectionId('');
    setTsId('');
    setRsId('');
  };

  const removeRow = (index: number) => setPending((prev) => prev.filter((_, i) => i !== index));

  // ── Submit ────────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (pending.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await Promise.all(
        pending.map((r) =>
          createCG.mutateAsync({
            teacher_subject_id: r.teacher_subject_id,
            room_schedule_id: r.room_schedule_id,
            section_id: r.section_id,
          })
        )
      );
      router.push('/class-groups');
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Class Groups"
        description="Combine sections, teacher-subjects, and room schedules"
        icon={<GraduationCap className="w-5 h-5" />}
        actions={
          <Link href="/class-groups">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
          </Link>
        }
      />

      <div className="space-y-4">

        {/* ── Add form — lives OUTSIDE the table so dropdowns are never clipped ── */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: '#333' }}>Add Class Group</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SearchableSelectField
              label="Section"
              placeholder="Search section..."
              options={sectionOptions}
              value={sectionId}
              onChange={setSectionId}
            />
            <SearchableSelectField
              label="Teacher → Subject"
              placeholder="Search teacher or subject..."
              options={tsOptions}
              value={tsId}
              onChange={setTsId}
            />
            <SearchableSelectField
              label="Room → Schedule"
              placeholder="Search room or schedule..."
              options={rsOptions}
              value={rsId}
              onChange={setRsId}
            />
          </div>
          {formError && <p className="text-xs font-mono" style={{ color: '#ef5350' }}>{formError}</p>}
          <div>
            <Button type="button" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onAdd}>
              Add to List
            </Button>
          </div>
        </div>

        {/* ── Pending rows table ── */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#333' }}>
              Pending Class Groups
              {pending.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#fce4ec', color: '#e91e8c' }}>
                  {pending.length}
                </span>
              )}
            </h2>
          </div>

          {pending.length === 0 ? (
            <p className="text-center text-sm py-10" style={{ color: '#bdbdbd' }}>
              No class groups added yet. Use the form above to add one.
            </p>
          ) : (
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '25%' }}>Section</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '35%' }}>Teacher → Subject</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '32%' }}>Room → Schedule</th>
                  <th style={{ width: '8%' }} />
                </tr>
              </thead>
              <tbody>
                {pending.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td className="px-4 py-2.5">
                      <span className="badge-green text-xs">{row.sectionLabel}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: '#333' }}>{row.tsLabel}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: '#333' }}>{row.rsLabel}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" className="btn-icon" style={{ color: '#ef5350' }} onClick={() => removeRow(i)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {submitError && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#fce4ec', color: '#c2185b' }}>{submitError}</p>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/class-groups">
            <Button variant="secondary" type="button">Cancel</Button>
          </Link>
          <Button onClick={onSubmit} loading={submitting} disabled={pending.length === 0}>
            Save Class Groups
          </Button>
        </div>
      </div>
    </>
  );
}
