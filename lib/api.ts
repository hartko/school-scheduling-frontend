// ─── Base config ─────────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL;

// Note: room-schedules has /api/ prefix, class-group is singular
const ENDPOINTS = {
  teachers: `${BASE}/teachers`,
  rooms: `${BASE}/rooms`,
  subjects: `${BASE}/subjects`,
  schedules: `${BASE}/schedules`,
  sections: `${BASE}/sections`,
  teacherSubjects: `${BASE}/teacher-subjects`,
  roomSchedules: `${BASE}/api/room-schedules`,
  classGroups: `${BASE}/class-group`,
} as const;

// ─── Generic fetch helpers ────────────────────────────────────────────────────
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error?.message ?? `Request failed: ${res.status}`);
  }

  // 204 No Content (DELETE)
  if (res.status === 204) return undefined as T;
  return res.json();
}
function getAll<T>(url: string, params?: Record<string, unknown>) {
  if (!params) return request<T>(url);
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  });
  const fullUrl = qs.toString() ? `${url}?${qs}` : url;
  return request<T>(fullUrl);
}

function get<T>(url: string) { return request<T>(url); }
function post<T>(url: string, body: unknown) { return request<T>(url, { method: 'POST', body: JSON.stringify(body) }); }
function patch<T>(url: string, body: unknown) { return request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }); }
function del<T>(url: string) { return request<T>(url, { method: 'DELETE' }); }

// ─── Teachers ─────────────────────────────────────────────────────────────────
export const teachersApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<Teacher[]>(ENDPOINTS.teachers, params),
  getById: (id: string) => get<Teacher>(`${ENDPOINTS.teachers}/${id}`),
  create: (data: TeacherInput) => post<Teacher>(ENDPOINTS.teachers, data),
  update: (id: string, data: Partial<TeacherInput>) => patch<Teacher>(`${ENDPOINTS.teachers}/${id}`, data),
  delete: (id: string) => del<void>(`${ENDPOINTS.teachers}/${id}`),
};

// ─── Rooms ───────────────────────────────────────────────────────────────────
export const roomsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<Room[]>(ENDPOINTS.rooms, params),
  getById: (id: string) => get<Room>(`${ENDPOINTS.rooms}/${id}`),
  create: (data: RoomInput) => post<Room>(ENDPOINTS.rooms, data),
  update: (id: string, data: Partial<RoomInput>) => patch<Room>(`${ENDPOINTS.rooms}/${id}`, data),
  delete: (id: string) => del<void>(`${ENDPOINTS.rooms}/${id}`),
};

// ─── Subjects ────────────────────────────────────────────────────────────────
export const subjectsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<Subject[]>(ENDPOINTS.subjects, params),
  getById: (id: string) => get<Subject>(`${ENDPOINTS.subjects}/${id}`),
  create: (data: SubjectInput) => post<Subject>(ENDPOINTS.subjects, data),
  update: (id: string, data: Partial<SubjectInput>) => patch<Subject>(`${ENDPOINTS.subjects}/${id}`, data),
  delete: (id: string) => del<void>(`${ENDPOINTS.subjects}/${id}`),
};

// ─── Schedules ───────────────────────────────────────────────────────────────
export const schedulesApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<Schedule[]>(ENDPOINTS.schedules, params),
  getById: (id: string) => get<Schedule>(`${ENDPOINTS.schedules}/${id}`),
  create: (data: ScheduleInput) => post<Schedule>(ENDPOINTS.schedules, data),
  update: (id: string, data: Partial<ScheduleInput>) => patch<Schedule>(`${ENDPOINTS.schedules}/${id}`, data),
  delete: (id: string) => del<void>(`${ENDPOINTS.schedules}/${id}`),
};

// ─── Sections ────────────────────────────────────────────────────────────────
export const sectionsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<Section[]>(ENDPOINTS.sections, params),
  getById: (id: string) => get<Section>(`${ENDPOINTS.sections}/${id}`),
  create: (data: SectionInput) => post<Section>(ENDPOINTS.sections, data),
  update: (id: string, data: Partial<SectionInput>) => patch<Section>(`${ENDPOINTS.sections}/${id}`, data),
  delete: (id: string) => del<void>(`${ENDPOINTS.sections}/${id}`),
};

// ─── Teacher Subjects ─────────────────────────────────────────────────────────
export const teacherSubjectsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<TeacherSubject[]>(ENDPOINTS.teacherSubjects, params),
  getById: (id: string) => get<TeacherSubject>(`${ENDPOINTS.teacherSubjects}/${id}`),
  create: (data: TeacherSubjectInput) => post<TeacherSubject>(ENDPOINTS.teacherSubjects, data),
  update: (id: string, data: Partial<TeacherSubjectInput>) => patch<TeacherSubject>(`${ENDPOINTS.teacherSubjects}/${id}`, data),
  delete: (id: string) => del<void>(`${ENDPOINTS.teacherSubjects}/${id}`),
};

// ─── Room Schedules (/api/room-schedules) ─────────────────────────────────────
export const roomSchedulesApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<RoomSchedule[]>(ENDPOINTS.roomSchedules, params),
  getById: (id: string) => get<RoomSchedule>(`${ENDPOINTS.roomSchedules}/${id}`),
  create: (data: RoomScheduleInput) => post<RoomSchedule>(ENDPOINTS.roomSchedules, data),
  update: (id: string, data: Partial<RoomScheduleInput>) => patch<RoomSchedule>(`${ENDPOINTS.roomSchedules}/${id}`, data),
  delete: (id: string) => del<void>(`${ENDPOINTS.roomSchedules}/${id}`),
};

// ─── Class Groups (/class-group singular) ─────────────────────────────────────
export const classGroupsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<ClassGroup[]>(ENDPOINTS.classGroups, params),
  getById: (id: string) => get<ClassGroup>(`${ENDPOINTS.classGroups}/${id}`),
  create: (data: ClassGroupInput) => post<ClassGroup>(ENDPOINTS.classGroups, data),
  update: (id: string, data: Partial<ClassGroupInput>) => patch<ClassGroup>(`${ENDPOINTS.classGroups}/${id}`, data),
  delete: (id: string) => del<void>(`${ENDPOINTS.classGroups}/${id}`),
};

// ─── Local types (mirrors lib/schemas.ts) ─────────────────────────────────────
import type {
  Teacher, Room, Subject, Schedule, Section,
  TeacherSubject, RoomSchedule, ClassGroup
} from './schemas';

type TeacherInput = Omit<Teacher, 'id'>;
type RoomInput = Omit<Room, 'id'>;
type SubjectInput = Omit<Subject, 'id'>;
type ScheduleInput = Omit<Schedule, 'id'>;
type SectionInput = Omit<Section, 'id'>;
type TeacherSubjectInput = Omit<TeacherSubject, 'id'>;
type RoomScheduleInput = Omit<RoomSchedule, 'id'>;
type ClassGroupInput = Omit<ClassGroup, 'id'>;
