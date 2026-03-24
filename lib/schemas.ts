import { z } from 'zod';

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ─── Teacher ──────────────────────────────────────────────────────────────────
export const teacherSchema = z.object({
  id: z.coerce.number().optional(),
  first_name: z.string().min(1, 'First name is required').max(100),
  middle_name: z.string().max(100).optional().or(z.literal('')),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  teacher_code: z.string().min(1, 'Teacher code is required').max(20),
});
export type Teacher = z.infer<typeof teacherSchema>;
export type TeacherInput = Omit<Teacher, 'id'>;

// ─── Room ─────────────────────────────────────────────────────────────────────
export const roomSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, 'Room name is required').max(100),
  capacity: z.coerce.number().int().positive('Capacity must be a positive integer'),
  level: z.coerce.number().int().positive('Level must be a positive integer')
});
export type Room = z.infer<typeof roomSchema>;
export type RoomInput = Omit<Room, 'id'>;

// ─── Subject ──────────────────────────────────────────────────────────────────
export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, 'Subject name is required').max(100),
  code: z.string().min(1, 'Subject code is required').max(20),
});
export type Subject = z.infer<typeof subjectSchema>;
export type SubjectInput = Omit<Subject, 'id'>;

// ─── Schedule ─────────────────────────────────────────────────────────────────
export const DAY_LABELS: Record<number, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
};
export const scheduleBaseSchema = z.object({
  id: z.coerce.number().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  is_break: z.boolean(),
  day: z.coerce.number().int().min(0).max(6, 'Day must be between 0 (Monday) and 6 (Sunday)'),
  name: z.string().min(1, 'Schedule name is required').max(100),
  description: z.string().max(255).optional(),
  schedule_code: z.string().max(20).optional()
});

// Lightweight schema for create/edit form (new separated structure)
export const scheduleFormSchema = z.object({
  name: z.string().min(1, 'Schedule name is required').max(100),
  schedule_code: z.string().max(20).optional().or(z.literal('')),
  description: z.string().max(255).optional().or(z.literal('')),
});
export type ScheduleFormInput = z.infer<typeof scheduleFormSchema>;

// ZodEffects — with cross-field validation (cannot .omit())
export const scheduleSchema = scheduleBaseSchema.refine(
  (d) => d.start_time < d.end_time,
  { message: 'End time must be after start time', path: ['end_time'] }
);

export type Schedule = z.infer<typeof scheduleSchema>;
export type ScheduleInput = Omit<Schedule, 'id'>;

// ─── ScheduleTime ─────────────────────────────────────────────────────────────
export interface ScheduleTime {
  id: number;
  schedule_id: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  day: number;
}

export const scheduleTimeFormSchema = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  is_break: z.boolean(),
  day: z.coerce.number().int().min(0).max(6),
}).refine((d) => d.start_time < d.end_time, {
  message: 'End time must be after start time',
  path: ['end_time'],
});
export type ScheduleTimeFormInput = z.infer<typeof scheduleTimeFormSchema>;

export interface ScheduleDetail {
  id: number;
  name: string;
  description?: string;
  schedule_code?: string;
  scheduleTimes: ScheduleTime[];
}

// ─── Section ──────────────────────────────────────────────────────────────────
export const sectionSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, 'Section name is required').max(100),
  code: z.string().min(1, 'Section code is required').max(20),
});
export type Section = z.infer<typeof sectionSchema>;
export type SectionInput = Omit<Section, 'id'>;

// ─── TeacherSubject ───────────────────────────────────────────────────────────
export const teacherSubjectSchema = z.object({
  id: z.coerce.number().optional(),
  teacher_id: z.coerce.number().min(1, 'Teacher is required'),
  subject_id: z.coerce.number().min(1, 'Subject is required'),
});
export type TeacherSubject = z.infer<typeof teacherSubjectSchema>;
export type TeacherSubjectInput = Omit<TeacherSubject, 'id'>;

// ─── RoomSchedule ─────────────────────────────────────────────────────────────
export const roomScheduleSchema = z.object({
  id: z.coerce.number().optional(),
  room_id: z.coerce.number().min(1, 'Room is required'),
  schedule_id: z.coerce.number().min(1, 'Schedule is required'),
});
export type RoomSchedule = z.infer<typeof roomScheduleSchema>;
export type RoomScheduleInput = Omit<RoomSchedule, 'id'>;

// ─── ClassGroup ───────────────────────────────────────────────────────────────
export const classGroupSchema = z.object({
  id: z.coerce.number().optional(),
  teacher_subject_id: z.coerce.number().min(1, 'Teacher Subject is required'),
  room_schedule_id: z.coerce.number().min(1, 'Room Schedule is required'),
  section_id: z.coerce.number().min(1, 'Section is required'),
});
export type ClassGroup = z.infer<typeof classGroupSchema>;
export type ClassGroupInput = Omit<ClassGroup, 'id'>;
