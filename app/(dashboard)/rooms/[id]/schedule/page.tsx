'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRooms } from '@/hooks/useRooms';
import { useRoomSchedules } from '@/hooks/useRoomSchedules';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Building2, ArrowLeft } from 'lucide-react';
import type { RoomScheduleDetail, ScheduleTime } from '@/lib/schemas';

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const DAY_LABELS: Record<number, string> = {
  0: 'Monday', 1: 'Tuesday', 2: 'Wednesday',
  3: 'Thursday', 4: 'Friday', 5: 'Saturday', 6: 'Sunday',
};

export default function RoomSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const roomId = Number(id);
  const [activeDay, setActiveDay] = useState(0);

  const { data: roomsData } = useRooms({ limit: 999 });
  const { data: allRS, isLoading } = useRoomSchedules({ limit: 999 });

  const room = roomsData?.data.find((r) => r.id === roomId);
  const roomSchedules = ((allRS?.data ?? []) as unknown as RoomScheduleDetail[]).filter((rs) => rs.room_id === roomId);

  // Build slot map by day across all assigned schedules
  const slotsByDay = new Map<number, ScheduleTime[]>();
  for (const rs of roomSchedules) {
    for (const t of rs.schedule.scheduleTimes) {
      if (!slotsByDay.has(t.day)) slotsByDay.set(t.day, []);
      slotsByDay.get(t.day)!.push(t);
    }
  }
  for (const [day, slots] of slotsByDay)
    slotsByDay.set(day, [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time)));

  const activeDaySlots = slotsByDay.get(activeDay) ?? [];

  return (
    <>
      <PageHeader
        title={room ? `${room.name} — Schedule` : 'Room Schedule'}
        description="Weekly time slots assigned to this room"
        icon={<Building2 className="w-5 h-5" />}
        actions={
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={() => router.back()}>
            Back
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-ink-400">
          <img src="/images/domi.png" alt="Loading" className="w-16 h-16 object-contain animate-pulse" />
          Loading schedule…
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Day tabs */}
          <div className="flex flex-wrap gap-1 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
            {DAYS.map((d) => {
              const count = slotsByDay.get(d)?.length ?? 0;
              const isActive = activeDay === d;
              return (
                <button key={d} onClick={() => setActiveDay(d)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors"
                  style={{
                    background: isActive ? '#e91e8c' : count > 0 ? '#fdf2f8' : '#f5f5f5',
                    color: isActive ? '#fff' : count > 0 ? '#c2185b' : '#bdbdbd',
                  }}>
                  {DAY_LABELS[d]}
                  {count > 0 && (
                    <span className="rounded-full px-1.5 py-0.5 text-xs font-mono"
                      style={{ background: isActive ? 'rgba(255,255,255,0.25)' : '#f8bbd0', color: isActive ? '#fff' : '#c2185b' }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Slots */}
          <div className="p-4">
            {activeDaySlots.length === 0 ? (
              <p className="text-center py-12 text-sm" style={{ color: '#9e9e9e' }}>
                No schedule on {DAY_LABELS[activeDay]}.
              </p>
            ) : (
              <div className="space-y-2">
                {activeDaySlots.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3 rounded-lg"
                    style={{
                      background: t.is_break ? '#fff8e1' : '#e8f5e9',
                      border: `1px solid ${t.is_break ? '#ffe082' : '#a5d6a7'}`,
                    }}>
                    <span className="font-mono text-sm font-semibold" style={{ color: t.is_break ? '#f57f17' : '#2e7d32' }}>
                      {t.start_time} – {t.end_time}
                    </span>
                    {t.is_break && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#ffe082', color: '#f57f17' }}>
                        Break
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
