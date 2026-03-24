'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateTeacherSubject } from '@/hooks/useTeacherSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { UserCheck, ArrowLeft, Plus, Trash2, X, Search } from 'lucide-react';
import Link from 'next/link';

interface PendingRow {
  teacher_id: number;
  subject_id: number;
  teacherLabel: string;
  subjectLabel: string;
}

export default function TeacherSubjectCreatePage() {
  const router = useRouter();
  const createTS = useCreateTeacherSubject();

  const { data: teachersData } = useTeachers({ limit: 999 });
  const { data: subjectsData } = useSubjects({ limit: 999 });
  const teachers = teachersData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  // ── Pending rows ──────────────────────────────────────────────────────────────
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [lockedTeacher, setLockedTeacher] = useState<string>(''); // locked after first add

  // Inline form state
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [subjectSearch, setSubjectSearch] = useState('');
  const [formError, setFormError] = useState('');

  const toggleSubject = (id: number) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const effectiveTeacher = lockedTeacher || selectedTeacher;

  const onAdd = () => {
    if (!effectiveTeacher) { setFormError('Select a teacher.'); return; }
    if (selectedSubjects.size === 0) { setFormError('Select at least one subject.'); return; }
    setFormError('');

    const teacher = teachers.find((t) => t.id === Number(effectiveTeacher));
    const teacherLabel = teacher ? `${teacher.first_name} ${teacher.last_name}` : effectiveTeacher;

    const newRows: PendingRow[] = Array.from(selectedSubjects).map((sid) => {
      const subject = subjects.find((s) => s.id === sid);
      return {
        teacher_id: Number(effectiveTeacher),
        subject_id: sid,
        teacherLabel,
        subjectLabel: subject?.name ?? String(sid),
      };
    });

    setPending((prev) => [...prev, ...newRows]);
    setLockedTeacher(effectiveTeacher);
    setSelectedSubjects(new Set()); // clear selections — added subjects will be filtered out
    setSubjectSearch('');
  };

  const removeRow = (index: number) => {
    const next = pending.filter((_, i) => i !== index);
    setPending(next);
    if (next.length === 0) setLockedTeacher(''); // unlock if all rows removed
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedTeacher('');
    setSelectedSubjects(new Set());
    setSubjectSearch('');
    setFormError('');
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (pending.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await Promise.all(pending.map((r) => createTS.mutateAsync({ teacher_id: r.teacher_id, subject_id: r.subject_id })));
      router.push('/teacher-subjects');
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  const addedSubjectIds = new Set(pending.map((r) => r.subject_id));

  const filteredSubjects = subjects.filter((s) => {
    if (addedSubjectIds.has(s.id!)) return false;
    const q = subjectSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader
        title="Assign Subjects"
        description="Assign one or more subjects to teachers"
        icon={<UserCheck className="w-5 h-5" />}
        actions={
          <Link href="/teacher-subjects">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
          </Link>
        }
      />

      <div className="space-y-6">
        {/* ── Assignments table ──────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#333' }}>Assignments</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9e9e9e' }}>
              {pending.length === 0 ? 'Add at least one assignment.' : `${pending.length} assignment${pending.length > 1 ? 's' : ''} pending`}
            </p>
          </div>

          <table className="w-full text-sm table-fixed" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '44%' }}>Teacher</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '44%' }}>Subject</th>
                <th style={{ width: '12%' }} />
              </tr>
            </thead>
            <tbody>
              {pending.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td className="px-4 py-2.5 font-medium">{row.teacherLabel}</td>
                  <td className="px-4 py-2.5">{row.subjectLabel}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button type="button" className="btn-icon" style={{ color: '#ef5350' }} onClick={() => removeRow(i)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Inline form */}
              {showForm && (
                <tr style={{ background: '#fdf2f8', borderBottom: '1px solid #f8bbd0' }}>
                  <td colSpan={3} className="px-4 py-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        {/* Teacher select */}
                        <div className="w-56 shrink-0">
                          <label className="form-label">
                            Teacher
                            {lockedTeacher && <span className="ml-1 normal-case font-normal" style={{ color: '#e91e8c' }}>— locked</span>}
                          </label>
                          {lockedTeacher ? (
                            <div className="form-input text-sm font-medium truncate" style={{ background: '#fdf2f8', borderColor: '#f8bbd0', color: '#c2185b' }}>
                              {teachers.find((t) => t.id === Number(lockedTeacher))
                                ? `${teachers.find((t) => t.id === Number(lockedTeacher))!.first_name} ${teachers.find((t) => t.id === Number(lockedTeacher))!.last_name}`
                                : lockedTeacher}
                            </div>
                          ) : (
                            <select
                              className="form-input text-sm"
                              value={selectedTeacher}
                              onChange={(e) => setSelectedTeacher(e.target.value)}
                            >
                              <option value="">Select teacher...</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={String(t.id)}>
                                  {t.first_name} {t.last_name} ({t.teacher_code})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Subject checkboxes */}
                        <div className="flex-1">
                          <label className="form-label">Subjects <span style={{ color: '#9e9e9e' }}>— pick one or more</span></label>
                          <div className="rounded-lg overflow-hidden" style={{ border: '1.5px solid #e0e0e0' }}>
                            <div className="flex items-center gap-2 px-2" style={{ borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#9e9e9e' }} />
                                <input
                                  type="text"
                                  placeholder="Search subjects..."
                                  value={subjectSearch}
                                  onChange={(e) => setSubjectSearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 text-sm bg-white focus:outline-none"
                                  style={{ color: '#333' }}
                                />
                              </div>
                              {filteredSubjects.length > 0 && (
                                <label className="flex items-center gap-1.5 text-xs font-medium shrink-0 cursor-pointer" style={{ color: '#757575' }}>
                                  <input
                                    type="checkbox"
                                    className="accent-pink-600 w-3.5 h-3.5"
                                    checked={filteredSubjects.every((s) => selectedSubjects.has(s.id!))}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedSubjects(new Set(filteredSubjects.map((s) => s.id!)));
                                      else setSelectedSubjects(new Set());
                                    }}
                                  />
                                  All
                                </label>
                              )}
                            </div>
                            {/* List */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-40 overflow-y-auto p-2" style={{ background: '#fff' }}>
                              {filteredSubjects.map((s) => (
                                <label
                                  key={s.id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors"
                                  style={{ background: selectedSubjects.has(s.id!) ? '#fdf2f8' : 'transparent' }}
                                >
                                  <input
                                    type="checkbox"
                                    className="accent-pink-600 w-3.5 h-3.5 shrink-0"
                                    checked={selectedSubjects.has(s.id!)}
                                    onChange={() => toggleSubject(s.id!)}
                                  />
                                  <span className="truncate">{s.name}</span>
                                  <span className="font-mono text-xs shrink-0" style={{ color: '#9e9e9e' }}>{s.code}</span>
                                </label>
                              ))}
                              {filteredSubjects.length === 0 && (
                                <p className="col-span-3 text-center py-3 text-xs" style={{ color: '#9e9e9e' }}>No subjects found</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {formError && <p className="text-xs font-mono" style={{ color: '#ef5350' }}>{formError}</p>}

                      <div className="flex items-center gap-2">
                        <Button type="button" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onAdd}>
                          Add {selectedSubjects.size > 0 ? `(${selectedSubjects.size})` : ''}
                        </Button>
                        <button type="button" className="btn-icon" style={{ color: '#9e9e9e' }} onClick={closeForm}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {/* Trigger row */}
              {!showForm && (
                <tr>
                  <td colSpan={3} className="px-4 py-3">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                      style={{ color: '#e91e8c' }}
                      onClick={() => setShowForm(true)}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Assignment
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
          <Link href="/teacher-subjects">
            <Button variant="secondary" type="button">Cancel</Button>
          </Link>
          <Button onClick={onSubmit} loading={submitting} disabled={pending.length === 0}>
            Save Assignments
          </Button>
        </div>
      </div>
    </>
  );
}
