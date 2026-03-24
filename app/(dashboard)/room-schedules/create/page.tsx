'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateRoomSchedule } from '@/hooks/useRoomSchedules';
import { useRooms } from '@/hooks/useRooms';
import { useSchedules } from '@/hooks/useSchedules';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { CalendarDays, ArrowLeft, Plus, Trash2, X, Search } from 'lucide-react';
import Link from 'next/link';

interface PendingRow {
  room_id: number;
  schedule_id: number;
  roomLabel: string;
  scheduleLabel: string;
}

export default function RoomScheduleCreatePage() {
  const router = useRouter();
  const createRS = useCreateRoomSchedule();

  const { data: roomsData } = useRooms({ limit: 999 });
  const { data: schedulesData } = useSchedules({ limit: 999 });
  const rooms = roomsData?.data ?? [];
  const schedules = schedulesData?.data ?? [];

  // ── Pending rows ──────────────────────────────────────────────────────────────
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [lockedSchedule, setLockedSchedule] = useState('');

  // Inline form state
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<Set<number>>(new Set());
  const [roomSearch, setRoomSearch] = useState('');
  const [formError, setFormError] = useState('');

  const effectiveSchedule = lockedSchedule || selectedSchedule;

  const toggleRoom = (id: number) => {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addedRoomIds = new Set(pending.map((r) => r.room_id));

  const filteredRooms = rooms.filter((r) => {
    if (addedRoomIds.has(r.id!)) return false;
    const q = roomSearch.toLowerCase();
    return r.name.toLowerCase().includes(q);
  });

  const onAdd = () => {
    if (!effectiveSchedule) { setFormError('Select a schedule.'); return; }
    if (selectedRooms.size === 0) { setFormError('Select at least one room.'); return; }
    setFormError('');

    const sched = schedules.find((s) => s.id === Number(effectiveSchedule));
    const scheduleLabel = sched?.name ?? effectiveSchedule;

    const newRows: PendingRow[] = Array.from(selectedRooms).map((rid) => {
      const room = rooms.find((r) => r.id === rid);
      return {
        room_id: rid,
        schedule_id: Number(effectiveSchedule),
        roomLabel: room?.name ?? String(rid),
        scheduleLabel,
      };
    });

    setPending((prev) => [...prev, ...newRows]);
    setLockedSchedule(effectiveSchedule);
    setSelectedRooms(new Set());
    setRoomSearch('');
  };

  const removeRow = (index: number) => {
    const next = pending.filter((_, i) => i !== index);
    setPending(next);
    if (next.length === 0) setLockedSchedule('');
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedSchedule('');
    setSelectedRooms(new Set());
    setRoomSearch('');
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
      await Promise.all(pending.map((r) => createRS.mutateAsync({ room_id: r.room_id, schedule_id: r.schedule_id })));
      router.push('/room-schedules');
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  const lockedSched = schedules.find((s) => s.id === Number(lockedSchedule));

  return (
    <>
      <PageHeader
        title="Assign Rooms"
        description="Assign multiple rooms to a schedule"
        icon={<CalendarDays className="w-5 h-5" />}
        actions={
          <Link href="/room-schedules">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>Back</Button>
          </Link>
        }
      />

      <div className="space-y-6">
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
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '44%' }}>Schedule</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9e9e9e', width: '44%' }}>Room</th>
                <th style={{ width: '12%' }} />
              </tr>
            </thead>
            <tbody>
              {pending.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td className="px-4 py-2.5 font-medium">{row.scheduleLabel}</td>
                  <td className="px-4 py-2.5">{row.roomLabel}</td>
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
                        {/* Schedule select */}
                        <div className="w-56 shrink-0">
                          <label className="form-label">
                            Schedule
                            {lockedSchedule && <span className="ml-1 normal-case font-normal" style={{ color: '#e91e8c' }}>— locked</span>}
                          </label>
                          {lockedSchedule ? (
                            <div className="form-input text-sm font-medium truncate" style={{ background: '#fdf2f8', borderColor: '#f8bbd0', color: '#c2185b' }}>
                              {lockedSched?.name ?? lockedSchedule}
                            </div>
                          ) : (
                            <select
                              className="form-input text-sm"
                              value={selectedSchedule}
                              onChange={(e) => setSelectedSchedule(e.target.value)}
                            >
                              <option value="">Select schedule...</option>
                              {schedules.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                  {s.name}{s.schedule_code ? ` (${s.schedule_code})` : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Room checkboxes */}
                        <div className="flex-1">
                          <label className="form-label">Rooms <span style={{ color: '#9e9e9e' }}>— pick one or more</span></label>
                          <div className="rounded-lg overflow-hidden" style={{ border: '1.5px solid #e0e0e0' }}>
                            <div className="flex items-center gap-2 px-2" style={{ borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#9e9e9e' }} />
                                <input
                                  type="text"
                                  placeholder="Search rooms..."
                                  value={roomSearch}
                                  onChange={(e) => setRoomSearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 text-sm bg-white focus:outline-none"
                                  style={{ color: '#333' }}
                                />
                              </div>
                              {filteredRooms.length > 0 && (
                                <label className="flex items-center gap-1.5 text-xs font-medium shrink-0 cursor-pointer" style={{ color: '#757575' }}>
                                  <input
                                    type="checkbox"
                                    className="accent-pink-600 w-3.5 h-3.5"
                                    checked={filteredRooms.every((r) => selectedRooms.has(r.id!))}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedRooms(new Set(filteredRooms.map((r) => r.id!)));
                                      else setSelectedRooms(new Set());
                                    }}
                                  />
                                  All
                                </label>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-40 overflow-y-auto p-2" style={{ background: '#fff' }}>
                              {filteredRooms.map((r) => (
                                <label
                                  key={r.id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors"
                                  style={{ background: selectedRooms.has(r.id!) ? '#fdf2f8' : 'transparent' }}
                                >
                                  <input
                                    type="checkbox"
                                    className="accent-pink-600 w-3.5 h-3.5 shrink-0"
                                    checked={selectedRooms.has(r.id!)}
                                    onChange={() => toggleRoom(r.id!)}
                                  />
                                  <span className="truncate">{r.name}</span>
                                  <span className="font-mono text-xs shrink-0" style={{ color: '#9e9e9e' }}>cap {r.capacity}</span>
                                </label>
                              ))}
                              {filteredRooms.length === 0 && (
                                <p className="col-span-3 text-center py-3 text-xs" style={{ color: '#9e9e9e' }}>
                                  {addedRoomIds.size === rooms.length ? 'All rooms added.' : 'No rooms found.'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {formError && <p className="text-xs font-mono" style={{ color: '#ef5350' }}>{formError}</p>}

                      <div className="flex items-center gap-2">
                        <Button type="button" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onAdd}>
                          Add {selectedRooms.size > 0 ? `(${selectedRooms.size})` : ''}
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
          <Link href="/room-schedules">
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
