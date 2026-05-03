'use client';
import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Users, Building2, BookOpen, Clock, Layers, GraduationCap,
  ArrowRight, Sunrise, Sunset, Timer, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useTeachers } from '@/hooks/useTeachers';
import { useRooms } from '@/hooks/useRooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useSchedules } from '@/hooks/useSchedules';
import { useSections } from '@/hooks/useSections';
import { useClassGroups } from '@/hooks/useClassGroups';
import { useRoomSchedules } from '@/hooks/useRoomSchedules';
import { useTeacherSubjects } from '@/hooks/useTeacherSubjects';
import type { RoomScheduleDetail } from '@/lib/schemas';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function minsToTime(m: number) {
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

function HoursTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg border border-ink-200">
      <p className="font-semibold text-ink-900 mb-1">{d.fullName}</p>
      <p className="text-ink-500">First class: <span className="font-bold text-accent">{d.firstTime}</span></p>
      <p className="text-ink-500">Last class ends: <span className="font-bold text-accent">{d.lastTime}</span></p>
      <p className="text-ink-500">Classes: <span className="font-bold text-ink-900">{d.classes}</span></p>
    </div>
  );
}

function SimpleTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg border border-ink-200">
      <p className="font-semibold text-ink-900">{label}</p>
      <p className="text-ink-500">{payload[0].name ?? 'Value'}: <span className="font-bold text-accent">{payload[0].value}</span></p>
    </div>
  );
}

function RankCard({ icon: Icon, label, items, accent }: {
  icon: React.ElementType;
  label: string;
  items: { name: string; value: string; code: string }[];
  accent: string;
}) {
  if (items.length === 0) return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + '22' }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h3 className="font-semibold text-sm text-ink-900">{label}</h3>
      </div>
      <p className="text-xs text-center py-4" style={{ color: '#bdbdbd' }}>No data yet</p>
    </div>
  );
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + '22' }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h3 className="font-semibold text-sm text-ink-900">{label}</h3>
      </div>
      <div className="space-y-2.5">
        {items.map((it, i) => (
          <div key={it.name} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
              style={{ background: i === 0 ? accent : '#f5f5f5', color: i === 0 ? '#fff' : '#616161' }}>
              {i + 1}
            </span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#e91e8c,#9c27b0)' }}>
              {it.code}
            </div>
            <span className="text-sm text-ink-800 flex-1 truncate">{it.name}</span>
            <span className="text-sm font-bold shrink-0" style={{ color: accent }}>{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: teachersData } = useTeachers({ limit: 999 });
  const { data: roomsData } = useRooms({ limit: 999 });
  const { data: subjectsData } = useSubjects({ limit: 1 });
  const { data: schedulesData } = useSchedules({ limit: 1 });
  const { data: sectionsData } = useSections({ limit: 1 });
  const { data: cgData } = useClassGroups({ limit: 9999 });
  const { data: rsData } = useRoomSchedules({ limit: 999 });
  const { data: tsData } = useTeacherSubjects({ limit: 999 });

  const teachers = teachersData?.data ?? [];
  const rooms = roomsData?.data ?? [];
  const classGroups = cgData?.data ?? [];
  const roomSchedules = (rsData?.data ?? []) as unknown as RoomScheduleDetail[];
  const teacherSubjects = tsData?.data ?? [];

  const totalTeachers = teachersData?.pagination?.totalItems ?? teachers.length;
  const totalRooms = roomsData?.pagination?.totalItems ?? rooms.length;
  const totalSubjects = subjectsData?.pagination?.totalItems ?? 0;
  const totalSchedules = schedulesData?.pagination?.totalItems ?? 0;
  const totalSections = sectionsData?.pagination?.totalItems ?? 0;
  const totalClassGroups = cgData?.pagination?.totalItems ?? classGroups.length;

  // Build schedule_time_id → {day, start_time, end_time, is_break}
  const scheduleTimeMap = useMemo(() => {
    const map = new Map<number, { day: number; start_time: string; end_time: string; is_break: boolean }>();
    for (const rs of roomSchedules) {
      for (const st of rs.schedule?.scheduleTimes ?? []) {
        if (!map.has(st.id)) map.set(st.id, st);
      }
    }
    return map;
  }, [roomSchedules]);

  // Build teacher_subject_id → teacher_id
  const tsTeacherMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const ts of teacherSubjects) if (ts.id != null) map.set(ts.id, ts.teacher_id);
    return map;
  }, [teacherSubjects]);

  // Build room_schedule_id → room_id
  const rsRoomMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const rs of roomSchedules) map.set(rs.id, rs.room_id);
    return map;
  }, [roomSchedules]);

  // Total non-break slots available per room_id
  const roomTotalSlots = useMemo(() => {
    const map = new Map<number, number>();
    for (const rs of roomSchedules) {
      const nonBreak = (rs.schedule?.scheduleTimes ?? []).filter(t => !t.is_break).length;
      map.set(rs.room_id, (map.get(rs.room_id) ?? 0) + nonBreak);
    }
    return map;
  }, [roomSchedules]);

  // Day load: class count per day
  const dayLoad = useMemo(() => {
    const counts = new Array(7).fill(0);
    for (const cg of classGroups) {
      if (cg.schedule_time_id == null) continue;
      const st = scheduleTimeMap.get(cg.schedule_time_id);
      if (st && !st.is_break) counts[st.day]++;
    }
    return DAY_NAMES.map((day, i) => ({ day, classes: counts[i] }));
  }, [classGroups, scheduleTimeMap]);

  // Teacher stats: count, firstStart (mins), lastEnd (mins)
  const teacherStats = useMemo(() => {
    const map = new Map<number, { count: number; firstStart: number; lastEnd: number }>();
    for (const cg of classGroups) {
      if (!cg.teacher_subject_id || !cg.schedule_time_id) continue;
      const teacherId = tsTeacherMap.get(cg.teacher_subject_id);
      if (!teacherId) continue;
      const st = scheduleTimeMap.get(cg.schedule_time_id);
      if (!st) continue;
      const [sh, sm] = st.start_time.split(':').map(Number);
      const [eh, em] = st.end_time.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      const prev = map.get(teacherId);
      if (prev) {
        prev.count++;
        prev.firstStart = Math.min(prev.firstStart, startMins);
        prev.lastEnd = Math.max(prev.lastEnd, endMins);
      } else {
        map.set(teacherId, { count: 1, firstStart: startMins, lastEnd: endMins });
      }
    }
    return map;
  }, [classGroups, tsTeacherMap, scheduleTimeMap]);

  // Classes per room
  const roomClassCount = useMemo(() => {
    const map = new Map<number, number>();
    for (const cg of classGroups) {
      if (!cg.room_schedule_id) continue;
      const roomId = rsRoomMap.get(cg.room_schedule_id);
      if (roomId != null) map.set(roomId, (map.get(roomId) ?? 0) + 1);
    }
    return map;
  }, [classGroups, rsRoomMap]);

  // Room utilization list
  const roomUtil = useMemo(() =>
    rooms
      .map(r => ({
        room: r.name!,
        used: roomClassCount.get(r.id!) ?? 0,
        total: roomTotalSlots.get(r.id!) ?? 0,
      }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.used - a.used),
    [rooms, roomClassCount, roomTotalSlots]
  );

  // Teacher rank data
  const teacherRankData = useMemo(() =>
    teachers
      .map(t => {
        const s = teacherStats.get(t.id!);
        return {
          id: t.id!,
          name: `${t.first_name} ${t.last_name}`,
          short: `${t.first_name[0]}${t.last_name[0]}`,
          classes: s?.count ?? 0,
          firstStart: s?.firstStart ?? 9999,
          lastEnd: s?.lastEnd ?? 0,
        };
      })
      .filter(t => t.classes > 0),
    [teachers, teacherStats]
  );

  // Alerts
  const alerts = useMemo(() => {
    const list: { type: 'warning' | 'ok'; msg: string }[] = [];
    if (totalClassGroups === 0) {
      list.push({ type: 'warning', msg: 'No class groups yet — use Auto-Generate on the Class Groups page' });
    } else {
      list.push({ type: 'ok', msg: `${totalClassGroups.toLocaleString()} class groups scheduled successfully` });
    }
    if (rooms.length > 0 && classGroups.length > 0) {
      const emptyRooms = rooms.filter(r => (roomClassCount.get(r.id!) ?? 0) === 0).length;
      if (emptyRooms > 0) {
        list.push({ type: 'warning', msg: `${emptyRooms} room${emptyRooms > 1 ? 's' : ''} have no classes assigned` });
      } else {
        list.push({ type: 'ok', msg: 'All rooms have at least one class assigned' });
      }
    }
    if (teachers.length > 0 && classGroups.length > 0) {
      const idle = teachers.filter(t => !teacherStats.has(t.id!)).length;
      if (idle > 0) {
        list.push({ type: 'warning', msg: `${idle} teacher${idle > 1 ? 's' : ''} have no classes scheduled` });
      } else {
        list.push({ type: 'ok', msg: 'All teachers have at least one class assigned' });
      }
    }
    return list;
  }, [totalClassGroups, rooms, classGroups, roomClassCount, teachers, teacherStats]);

  // Chart data
  const teacherChartData = useMemo(() =>
    [...teacherRankData]
      .sort((a, b) => b.classes - a.classes)
      .slice(0, 10)
      .map(t => ({
        name: t.short,
        fullName: t.name,
        classes: t.classes,
        firstTime: minsToTime(t.firstStart),
        lastTime: minsToTime(t.lastEnd),
      })),
    [teacherRankData]
  );

  const maxClasses = Math.max(...teacherChartData.map(d => d.classes), 1);

  const byFirstClass = [...teacherRankData].sort((a, b) => a.firstStart - b.firstStart);
  const byLastClass  = [...teacherRankData].sort((a, b) => b.lastEnd   - a.lastEnd);
  const byCount      = [...teacherRankData].sort((a, b) => b.classes   - a.classes);

  const STATS = [
    { label: 'Teachers',     count: totalTeachers,    icon: Users,         href: '/teachers',     iconBg: '#fce4ec', iconColor: '#e91e8c' },
    { label: 'Rooms',        count: totalRooms,        icon: Building2,     href: '/rooms',        iconBg: '#f3e5f5', iconColor: '#9c27b0' },
    { label: 'Subjects',     count: totalSubjects,     icon: BookOpen,      href: '/subjects',     iconBg: '#fce4ec', iconColor: '#c2185b' },
    { label: 'Schedules',    count: totalSchedules,    icon: Clock,         href: '/schedules',    iconBg: '#f8bbd0', iconColor: '#ad1457' },
    { label: 'Sections',     count: totalSections,     icon: Layers,        href: '/sections',     iconBg: '#fce4ec', iconColor: '#e91e8c' },
    { label: 'Class Groups', count: totalClassGroups,  icon: GraduationCap, href: '/class-groups', iconBg: '#f3e5f5', iconColor: '#7b1fa2' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm mt-1 text-ink-500">Welcome back, Admin. Here&apos;s your school at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}
              className="card p-5 group transition-all hover:-translate-y-0.5"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.iconBg }}>
                  <Icon className="w-5 h-5" style={{ color: s.iconColor }} />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-200 group-hover:text-accent transition-colors" />
              </div>
              <p className="font-display text-3xl font-bold text-ink-900">{s.count.toLocaleString()}</p>
              <p className="text-sm mt-0.5 text-ink-500">{s.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm border ${
              a.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {a.type === 'warning'
                ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />}
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Classes per teacher */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm text-ink-900 mb-1">Classes per Teacher (Top 10)</h2>
          <p className="text-xs text-ink-400 mb-4">Hover for first / last class times</p>
          {teacherChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-xs" style={{ color: '#bdbdbd' }}>
              No class groups yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={teacherChartData} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
                <Tooltip content={<HoursTooltip />} cursor={{ fill: 'rgba(233,30,140,0.06)' }} />
                <Bar dataKey="classes" name="Classes" radius={[6, 6, 0, 0]}>
                  {teacherChartData.map((entry) => (
                    <Cell key={entry.name}
                      fill={entry.classes === maxClasses ? 'url(#gradHigh)' : 'url(#gradLow)'} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e91e8c" /><stop offset="100%" stopColor="#c2185b" />
                  </linearGradient>
                  <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f06292" /><stop offset="100%" stopColor="#e91e8c88" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Class load by day */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm text-ink-900 mb-1">Class Load by Day</h2>
          <p className="text-xs text-ink-400 mb-4">Total classes scheduled per weekday</p>
          {dayLoad.every(d => d.classes === 0) ? (
            <div className="flex items-center justify-center h-48 text-xs" style={{ color: '#bdbdbd' }}>
              No class groups yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <ResponsiveContainer width="100%" height={195}>
                <BarChart data={dayLoad} barSize={22} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'rgba(233,30,140,0.06)' }} />
                  <Bar dataKey="classes" name="Classes" radius={[5, 5, 0, 0]} fill="#e91e8c" />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={195}>
                <RadarChart data={dayLoad.map(d => ({ subject: d.day, A: d.classes }))} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9e9e9e' }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar dataKey="A" stroke="#e91e8c" fill="#e91e8c" fillOpacity={0.25} dot={{ r: 3, fill: '#e91e8c' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Room utilization */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-sm text-ink-900">Room Utilization</h2>
        </div>
        <p className="text-xs text-ink-400 mb-4">Classes assigned vs. available slots per room</p>
        {roomUtil.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: '#bdbdbd' }}>No data yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
            {roomUtil.map((r) => {
              const pct = r.total > 0 ? Math.round((r.used / r.total) * 100) : 0;
              const full = pct >= 100;
              const empty = r.used === 0;
              return (
                <div key={r.room}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-ink-700 truncate">{r.room}</span>
                    <span className={`text-xs font-bold ml-2 shrink-0 ${full ? 'text-rose-500' : empty ? 'text-amber-500' : 'text-ink-900'}`}>
                      {r.used}/{r.total}{full ? ' · full' : empty ? ' · empty' : ''}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${pct}%`,
                      background: full
                        ? 'linear-gradient(90deg,#ef5350,#c62828)'
                        : empty
                        ? '#fbbf24'
                        : 'linear-gradient(90deg,#e91e8c,#9c27b0)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RankCard icon={Sunrise} label="Earliest First Class" accent="#e91e8c"
          items={byFirstClass.slice(0, 4).map(t => ({ name: t.name, value: minsToTime(t.firstStart), code: t.short }))} />
        <RankCard icon={Sunset} label="Latest Last Class" accent="#9c27b0"
          items={byLastClass.slice(0, 4).map(t => ({ name: t.name, value: minsToTime(t.lastEnd), code: t.short }))} />
        <RankCard icon={Timer} label="Most Classes" accent="#c2185b"
          items={byCount.slice(0, 4).map(t => ({ name: t.name, value: `${t.classes} classes`, code: t.short }))} />
      </div>

      {/* Workflow guide */}
      <div className="card p-6">
        <h2 className="section-title mb-1">Getting Started</h2>
        <p className="text-sm mb-5 text-ink-500">Follow these steps to set up your school schedule</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Set Up Resources',
              items: ['Add Teachers', 'Add Rooms', 'Add Subjects', 'Add Schedules', 'Add Sections'],
              bg: '#fce4ec', border: '#f48fb1', num: '#e91e8c' },
            { step: '02', title: 'Create Assignments',
              items: ['Assign Subject → Teacher', 'Assign Schedule → Room'],
              bg: '#f3e5f5', border: '#ce93d8', num: '#9c27b0' },
            { step: '03', title: 'Build Class Groups',
              items: ['Use Auto-Generate on Class Groups page to assign all sections automatically'],
              bg: '#fce4ec', border: '#f48fb1', num: '#c2185b' },
          ].map((phase) => (
            <div key={phase.step} className="rounded-xl p-4"
              style={{ background: phase.bg, border: `1px solid ${phase.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: phase.num }}>{phase.step}</span>
                <p className="font-semibold text-sm text-ink-900">{phase.title}</p>
              </div>
              <ul className="space-y-1.5">
                {phase.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-xs text-ink-700">
                    <span className="mt-0.5 font-bold" style={{ color: phase.num }}>→</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
