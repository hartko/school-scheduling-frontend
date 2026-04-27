'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSections } from '@/hooks/useSections';
import { useSubjects } from '@/hooks/useSubjects';
import { sectionSubjectsApi } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';
import { Layers, ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

interface PendingRow {
  section_id: number;
  subject_id: number;
  units?: number;
  sectionLabel: string;
  subjectLabel: string;
  [key: string]: unknown;
}

export default function SectionSubjectCreatePage() {
  const router = useRouter();

  const { data: sectionsData } = useSections({ limit: 999 });
  const { data: subjectsData } = useSubjects({ limit: 999 });
  const sections = sectionsData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  const [pending, setPending] = useState<PendingRow[]>([]);
  const [lockedSection, setLockedSection] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<PendingRow>>(new Set());

  const toggleRowSelection = (row: PendingRow) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(row) ? next.delete(row) : next.add(row);
      return next;
    });
  };

  const deleteSelected = () => {
    const next = pending.filter((r) => !selectedRows.has(r));
    setPending(next);
    setSelectedRows(new Set());
    if (next.length === 0) setLockedSection('');
  };

  const columns: Column<PendingRow>[] = [
    {
      key: '_sel',
      header: (
        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
          checked={pending.length > 0 && selectedRows.size === pending.length}
          onChange={(e) => setSelectedRows(e.target.checked ? new Set(pending) : new Set())} />
      ),
      width: '40px',
      render: (_, row) => (
        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
          checked={selectedRows.has(row)}
          onChange={() => toggleRowSelection(row)} />
      ),
    },
    { key: 'sectionLabel', header: 'Section', sortable: true },
    { key: 'subjectLabel', header: 'Subject', sortable: true },
    { key: 'units', header: 'Units', width: '80px', render: (v) => v ? <span className="badge-orange font-mono text-xs">{String(v)}u</span> : <span style={{ color: '#bdbdbd' }}>—</span> },
  ];

  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [subjectUnits, setSubjectUnits] = useState<Map<number, number>>(new Map());
  const [subjectSearch, setSubjectSearch] = useState('');
  const [formError, setFormError] = useState('');

  const effectiveSection = lockedSection || selectedSection;
  const addedSubjectIds = new Set(pending.map((r) => r.subject_id));

  const filteredSubjects = subjects.filter((s) => {
    if (addedSubjectIds.has(s.id!)) return false;
    const q = subjectSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.code ?? '').toLowerCase().includes(q);
  });

  const onAdd = () => {
    if (!effectiveSection) { setFormError('Select a section.'); return; }
    if (selectedSubjects.size === 0) { setFormError('Select at least one subject.'); return; }
    setFormError('');

    const section = sections.find((s) => s.id === Number(effectiveSection));
    const sectionLabel = section ? `${section.name} (${section.code})` : effectiveSection;

    const newRows: PendingRow[] = Array.from(selectedSubjects).map((sid) => {
      const subject = subjects.find((s) => s.id === sid);
      return {
        section_id: Number(effectiveSection),
        subject_id: sid,
        units: subjectUnits.get(sid),
        sectionLabel,
        subjectLabel: subject?.name ?? String(sid),
      };
    });

    setPending((prev) => [...prev, ...newRows]);
    setLockedSection(effectiveSection);
    setSelectedSubjects(new Set());
    setSubjectUnits(new Map());
    setSubjectSearch('');
  };

  const removeRow = (row: PendingRow) => {
    const next = pending.filter((r) => r !== row);
    setPending(next);
    if (next.length === 0) setLockedSection('');
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (pending.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await Promise.all(pending.map((r) => sectionSubjectsApi.create({ section_id: r.section_id, subject_id: r.subject_id, units: r.units })));
      router.push('/sections');
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  const lockedSectionObj = sections.find((s) => s.id === Number(lockedSection));

  return (
    <>
      <PageHeader
        title="Assign Subjects to Section"
        description="Assign one or more subjects to a section"
        icon={<Layers className="w-5 h-5" />}
        actions={
          <Link href="/sections">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
          </Link>
        }
      />

      <div className="space-y-6">
        {pending.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#333' }}>Assignments</h2>
                <p className="text-xs mt-0.5" style={{ color: '#9e9e9e' }}>
                  {`${pending.length} assignment${pending.length > 1 ? 's' : ''} pending`}
                </p>
              </div>
              {selectedRows.size > 0 && (
                <Button type="button" variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={deleteSelected}>
                  Delete ({selectedRows.size})
                </Button>
              )}
            </div>
            <div className="p-4">
              <DataTable<PendingRow>
                data={pending}
                columns={columns}
                actions={(row) => (
                  <button type="button" className="btn-icon" style={{ color: '#ef5350' }} onClick={() => removeRow(row)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                searchKeys={['sectionLabel', 'subjectLabel']}
                emptyMessage="No assignments added yet."
              />
            </div>
          </div>
        )}

        <div className="card p-4" style={{ background: '#fdf2f8', border: '1px solid #f8bbd0' }}>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Section select */}
              <div className="w-full sm:w-72 shrink-0">
                <label className="form-label">
                  Section
                  {lockedSection && <span className="ml-1 normal-case font-normal" style={{ color: '#e91e8c' }}>— locked</span>}
                </label>
                {lockedSection ? (
                  <div className="form-input text-sm font-medium truncate"
                    style={{ background: '#fdf2f8', borderColor: '#f8bbd0', color: '#c2185b' }}>
                    {lockedSectionObj ? `${lockedSectionObj.name} (${lockedSectionObj.code})` : lockedSection}
                  </div>
                ) : (
                  <select className="form-input text-sm" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                    <option value="">Select section...</option>
                    {sections.map((s) => (
                      <option key={s.id} value={String(s.id)}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subject checkboxes */}
              <div className="flex-1 w-full">
                <label className="form-label">Subjects <span style={{ color: '#9e9e9e' }}>— pick one or more</span></label>
                <div className="rounded-lg overflow-hidden" style={{ border: '1.5px solid #e0e0e0' }}>
                  <div className="flex items-center gap-2 px-2" style={{ borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#9e9e9e' }} />
                      <input type="text" placeholder="Search subjects..." value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-white focus:outline-none" style={{ color: '#333' }} />
                    </div>
                    {filteredSubjects.length > 0 && (
                      <label className="flex items-center gap-1.5 text-xs font-medium shrink-0 cursor-pointer" style={{ color: '#757575' }}>
                        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5"
                          checked={filteredSubjects.every((s) => selectedSubjects.has(s.id!))}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedSubjects(new Set(filteredSubjects.map((s) => s.id!)));
                            else setSelectedSubjects(new Set());
                          }} />
                        All
                      </label>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 max-h-96 overflow-y-auto p-2" style={{ background: '#fff' }}>
                    {filteredSubjects.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
                        style={{ background: selectedSubjects.has(s.id!) ? '#fdf2f8' : 'transparent' }}>
                        <input type="checkbox" className="accent-pink-600 w-3.5 h-3.5 shrink-0 cursor-pointer"
                          checked={selectedSubjects.has(s.id!)}
                          onChange={() => setSelectedSubjects((prev) => { const n = new Set(prev); n.has(s.id!) ? n.delete(s.id!) : n.add(s.id!); return n; })} />
                        <span className="truncate flex-1">{s.name}</span>
                        <span className="font-mono text-xs shrink-0" style={{ color: '#9e9e9e' }}>{s.code}</span>
                        {selectedSubjects.has(s.id!) && (
                          <input type="number" min={1} placeholder="units"
                            value={subjectUnits.get(s.id!) ?? ''}
                            onChange={(e) => setSubjectUnits((prev) => { const n = new Map(prev); e.target.value ? n.set(s.id!, Number(e.target.value)) : n.delete(s.id!); return n; })}
                            className="w-16 text-center text-xs border rounded px-1 py-0.5 focus:outline-none shrink-0"
                            style={{ borderColor: '#f8bbd0', color: '#c2185b' }} />
                        )}
                      </div>
                    ))}
                    {filteredSubjects.length === 0 && (
                      <p className="col-span-full text-center py-3 text-xs" style={{ color: '#9e9e9e' }}>
                        {addedSubjectIds.size === subjects.length ? 'All subjects added.' : 'No subjects found.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {formError && <p className="text-xs font-mono" style={{ color: '#ef5350' }}>{formError}</p>}

            <Button type="button" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onAdd}>
              Add {selectedSubjects.size > 0 ? `(${selectedSubjects.size})` : ''}
            </Button>
          </div>
        </div>

        {submitError && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#fce4ec', color: '#c2185b' }}>{submitError}</p>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/sections">
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
