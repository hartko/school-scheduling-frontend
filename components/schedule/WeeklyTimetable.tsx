'use client';
import { formatTime } from '@/lib/utils';

export interface TimetableEntry {
  scheduleTimeId: number;
  label: string;
  sublabel?: string;
  colorKey: string;
}

export interface TimetableSlot {
  id: number;
  day: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
}

interface WeeklyTimetableProps {
  scheduleTimes: TimetableSlot[];
  entries: TimetableEntry[];
}

const DAY_SHORT: Record<number, string> = {
  0: 'Monday', 1: 'Tuesday', 2: 'Wednesday',
  3: 'Thursday', 4: 'Friday', 5: 'Saturday', 6: 'Sunday',
};

const PALETTE = [
  { bg: '#e3f2fd', border: '#90caf9', text: '#0d47a1' },
  { bg: '#e8f5e9', border: '#a5d6a7', text: '#1b5e20' },
  { bg: '#fff3e0', border: '#ffcc80', text: '#e65100' },
  { bg: '#fce4ec', border: '#f48fb1', text: '#880e4f' },
  { bg: '#f3e5f5', border: '#ce93d8', text: '#4a148c' },
  { bg: '#e0f7fa', border: '#80deea', text: '#006064' },
  { bg: '#fff8e1', border: '#ffe082', text: '#f57f17' },
  { bg: '#fbe9e7', border: '#ffab91', text: '#bf360c' },
  { bg: '#f1f8e9', border: '#c5e1a5', text: '#33691e' },
  { bg: '#ede7f6', border: '#b39ddb', text: '#311b92' },
];

function colorFor(key: string) {
  const hash = key.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return PALETTE[hash % PALETTE.length];
}

export function WeeklyTimetable({ scheduleTimes, entries }: WeeklyTimetableProps) {
  if (scheduleTimes.length === 0) {
    return (
      <p className="text-center py-8 text-sm" style={{ color: '#9e9e9e' }}>
        No schedule data available.
      </p>
    );
  }

  // Build list of unique days present in the schedule times
  const days = [...new Set(scheduleTimes.map((s) => s.day))].sort((a, b) => a - b);

  // Build unique time rows by (start_time, end_time) only — is_break varies per day
  // (e.g. day 6 marks every slot as break while other days don't)
  const timeRowMap = new Map<string, { start: string; end: string }>();
  for (const st of scheduleTimes) {
    const key = `${st.start_time}|${st.end_time}`;
    if (!timeRowMap.has(key)) {
      timeRowMap.set(key, { start: st.start_time, end: st.end_time });
    }
  }
  const timeRows = [...timeRowMap.values()].sort((a, b) => a.start.localeCompare(b.start));

  // Per-cell break lookup: `${day}|${start}|${end}` → is_break
  const breakLookup = new Map<string, boolean>();
  for (const st of scheduleTimes) {
    breakLookup.set(`${st.day}|${st.start_time}|${st.end_time}`, st.is_break);
  }

  // Build lookup: scheduleTimeId → entry
  const entryBySlot = new Map<number, TimetableEntry[]>();
  for (const e of entries) {
    const list = entryBySlot.get(e.scheduleTimeId) ?? [];
    list.push(e);
    entryBySlot.set(e.scheduleTimeId, list);
  }

  // Build lookup: `${day}|${start}|${end}` → scheduleTimeId
  const slotIdLookup = new Map<string, number>();
  for (const st of scheduleTimes) {
    slotIdLookup.set(`${st.day}|${st.start_time}|${st.end_time}`, st.id);
  }

  // Unmatched entries (schedule_time_id null or not found in scheduleTimes)
  const matchedIds = new Set(scheduleTimes.map((s) => s.id));
  const unmatched = entries.filter((e) => !matchedIds.has(e.scheduleTimeId));

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-lg" style={{ border: '1.5px solid #e0e0e0', maxHeight: '480px' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '90px' }} />
            {days.map((d) => <col key={d} />)}
          </colgroup>
          <thead>
            <tr style={{ background: '#fafafa', position: 'sticky', top: 0, zIndex: 2 }}>
              <th className="text-xs font-semibold px-2 py-2.5 text-left" style={{ color: '#9e9e9e', borderBottom: '2px solid #e0e0e0', borderRight: '1px solid #f0f0f0' }}>
                Time
              </th>
              {days.map((d) => (
                <th key={d} className="text-xs font-semibold px-2 py-2.5 text-center uppercase tracking-wide"
                  style={{ color: '#424242', borderBottom: '2px solid #e0e0e0', borderRight: '1px solid #f0f0f0' }}>
                  {DAY_SHORT[d] ?? `Day ${d}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRows.map((row, ri) => {
              return (
                <tr key={ri} style={{ background: '#fff' }}>
                  {/* Time label */}
                  <td className="px-2 py-1.5 text-right align-top whitespace-nowrap"
                    style={{
                      fontSize: '11px',
                      color: '#757575',
                      borderRight: '1px solid #f0f0f0',
                      borderBottom: '1px solid #f5f5f5',
                      fontFamily: 'monospace',
                      minWidth: '90px',
                    }}>
                    {formatTime(row.start)}
                    <span style={{ color: '#e0e0e0' }}> – </span>
                    {formatTime(row.end)}
                  </td>

                  {/* Day columns */}
                  {days.map((day) => {
                    const isBreakCell = breakLookup.get(`${day}|${row.start}|${row.end}`) ?? false;
                    const slotId = slotIdLookup.get(`${day}|${row.start}|${row.end}`);
                    const cellEntries = slotId !== undefined ? (entryBySlot.get(slotId) ?? []) : [];

                    if (isBreakCell) {
                      return (
                        <td key={day} style={{ borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', background: '#f5f5f5' }} />
                      );
                    }

                    return (
                      <td key={day} className="px-1.5 py-1.5 align-top"
                        style={{ borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f5f5f5', minHeight: '52px' }}>
                        {cellEntries.map((entry, ei) => {
                          const c = colorFor(entry.colorKey);
                          return (
                            <div key={ei} className="rounded px-1.5 py-1 text-center leading-tight"
                              style={{
                                background: c.bg,
                                border: `1px solid ${c.border}`,
                                color: c.text,
                                marginBottom: ei < cellEntries.length - 1 ? '2px' : 0,
                              }}>
                              <div className="font-semibold" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                                {entry.label}
                              </div>
                              {entry.sublabel && (
                                <div style={{ fontSize: '10px', opacity: 0.8, lineHeight: '1.2' }}>
                                  {entry.sublabel}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Unmatched entries (legacy class groups without schedule_time_id) */}
      {unmatched.length > 0 && (
        <div className="rounded-lg px-3 py-2" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
          <p className="text-xs font-medium mb-1.5" style={{ color: '#f57f17' }}>
            {unmatched.length} class group{unmatched.length !== 1 ? 's' : ''} without a specific time slot
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unmatched.map((e, i) => (
              <span key={i} className="rounded px-2 py-0.5 text-xs font-medium"
                style={{ background: '#fff3e0', border: '1px solid #ffcc80', color: '#e65100' }}>
                {e.label}{e.sublabel ? ` · ${e.sublabel}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
