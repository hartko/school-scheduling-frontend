'use client';
import { generateId } from './utils';
import type { Teacher, Room, Subject, Schedule, Section, TeacherSubject, RoomSchedule, ClassGroup } from './schemas';

// ─── In-memory store ──────────────────────────────────────────────────────────
let teachers: Teacher[] = [
  { id: '1', first_name: 'Maria', middle_name: 'Santos', last_name: 'Cruz', email: 'mcruz@school.edu', teacher_code: 'TC001' },
  { id: '2', first_name: 'Jose', middle_name: '', last_name: 'Reyes', email: 'jreyes@school.edu', teacher_code: 'TC002' },
  { id: '3', first_name: 'Ana', middle_name: 'Luz', last_name: 'Garcia', email: 'agarcia@school.edu', teacher_code: 'TC003' },
];

let rooms: Room[] = [
  { id: '1', name: 'Room 101', capacity: 40, level: 'Junior High' },
  { id: '2', name: 'Science Lab', capacity: 30, level: 'Senior High' },
  { id: '3', name: 'Computer Room', capacity: 35, level: 'College' },
];

let subjects: Subject[] = [
  { id: '1', name: 'Mathematics', code: 'MATH101' },
  { id: '2', name: 'English', code: 'ENG101' },
  { id: '3', name: 'Science', code: 'SCI101' },
];

let schedules: Schedule[] = [
  { id: '1', start_time: '07:00', end_time: '08:00', is_break: false, day: 'Monday' },
  { id: '2', start_time: '08:00', end_time: '09:00', is_break: false, day: 'Monday' },
  { id: '3', start_time: '12:00', end_time: '13:00', is_break: true, day: 'Monday' },
];

let sections: Section[] = [
  { id: '1', name: 'Section A', code: 'SEC-A' },
  { id: '2', name: 'Section B', code: 'SEC-B' },
];

let teacherSubjects: TeacherSubject[] = [
  { id: '1', teacher_id: '1', subject_id: '1' },
  { id: '2', teacher_id: '2', subject_id: '2' },
];

let roomSchedules: RoomSchedule[] = [
  { id: '1', room_id: '1', schedule_id: '1' },
  { id: '2', room_id: '2', schedule_id: '2' },
];

let classGroups: ClassGroup[] = [
  { id: '1', teacher_subject_id: '1', room_schedule_id: '1', section_id: '1' },
];

// ─── Generic CRUD factory ─────────────────────────────────────────────────────
function createStore<T extends { id?: string }>(initial: T[]) {
  let items = [...initial];
  return {
    getAll: () => [...items],
    getById: (id: string) => items.find((i) => i.id === id),
    create: (data: Omit<T, 'id'>): T => {
      const item = { ...data, id: generateId() } as T;
      items.push(item);
      return item;
    },
    update: (id: string, data: Partial<T>): T | null => {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...data, id };
      return items[idx];
    },
    delete: (id: string): boolean => {
      const len = items.length;
      items = items.filter((i) => i.id !== id);
      return items.length < len;
    },
    bulkCreate: (dataArr: Omit<T, 'id'>[]): T[] => {
      return dataArr.map((d) => {
        const item = { ...d, id: generateId() } as T;
        items.push(item);
        return item;
      });
    },
  };
}

export const teacherStore = createStore<Teacher>(teachers);
export const roomStore = createStore<Room>(rooms);
export const subjectStore = createStore<Subject>(subjects);
export const scheduleStore = createStore<Schedule>(schedules);
export const sectionStore = createStore<Section>(sections);
export const teacherSubjectStore = createStore<TeacherSubject>(teacherSubjects);
export const roomScheduleStore = createStore<RoomSchedule>(roomSchedules);
export const classGroupStore = createStore<ClassGroup>(classGroups);
