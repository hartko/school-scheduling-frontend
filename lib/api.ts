// ─── Base config ─────────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL;
const SCHEDULER = process.env.NEXT_PUBLIC_SCHEDULER_URL;

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
  sectionSubjects: `${BASE}/section-subjects`,
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
  getAll: (params?: { page?: number; limit?: number }) => getAll<PaginatedResponse<Teacher>>(ENDPOINTS.teachers, params),
  getById: (id: number) => get<Teacher>(`${ENDPOINTS.teachers}/${id}`),
  create: (data: TeacherInput) => post<Teacher>(ENDPOINTS.teachers, data),
  update: (id: number, data: Partial<TeacherInput>) => patch<Teacher>(`${ENDPOINTS.teachers}/${id}`, data),
  delete: (id: number) => del<void>(`${ENDPOINTS.teachers}/${id}`),
};

// ─── Rooms ───────────────────────────────────────────────────────────────────
export const roomsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<PaginatedResponse<Room>>(ENDPOINTS.rooms, params),
  getById: (id: number) => get<Room>(`${ENDPOINTS.rooms}/${id}`),
  create: (data: RoomInput) => post<Room>(ENDPOINTS.rooms, data),
  update: (id: number, data: Partial<RoomInput>) => patch<Room>(`${ENDPOINTS.rooms}/${id}`, data),
  delete: (id: number) => del<void>(`${ENDPOINTS.rooms}/${id}`),
};

// ─── Subjects ────────────────────────────────────────────────────────────────
export const subjectsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<PaginatedResponse<Subject>>(ENDPOINTS.subjects, params),
  getById: (id: number) => get<Subject>(`${ENDPOINTS.subjects}/${id}`),
  create: (data: SubjectInput) => post<Subject>(ENDPOINTS.subjects, data),
  update: (id: number, data: Partial<SubjectInput>) => patch<Subject>(`${ENDPOINTS.subjects}/${id}`, data),
  delete: (id: number) => del<void>(`${ENDPOINTS.subjects}/${id}`),
};

// ─── Schedules ───────────────────────────────────────────────────────────────
export const schedulesApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<PaginatedResponse<Schedule>>(ENDPOINTS.schedules, params),
  getById: (id: number) => get<ScheduleDetail>(`${ENDPOINTS.schedules}/${id}`),
  create: (data: ScheduleFormInput) => post<ScheduleDetail>(ENDPOINTS.schedules, data),
  update: (id: number, data: Partial<ScheduleFormInput>) => patch<ScheduleDetail>(`${ENDPOINTS.schedules}/${id}`, data),
  delete: (id: number) => del<void>(`${ENDPOINTS.schedules}/${id}`),
};

// ─── Schedule Times ───────────────────────────────────────────────────────────
export const scheduleTimesApi = {
  create: (scheduleId: number, data: Omit<ScheduleTime, 'id' | 'schedule_id'>) =>
    post<ScheduleTime>(`${ENDPOINTS.schedules}/${scheduleId}/times`, data),
  update: (scheduleId: number, id: number, data: Partial<Omit<ScheduleTime, 'id' | 'schedule_id'>>) =>
    patch<ScheduleTime>(`${ENDPOINTS.schedules}/${scheduleId}/times/${id}`, data),
  delete: (scheduleId: number, id: number) =>
    del<void>(`${ENDPOINTS.schedules}/${scheduleId}/times/${id}`),
};

// ─── Sections ────────────────────────────────────────────────────────────────
export const sectionsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<PaginatedResponse<Section>>(ENDPOINTS.sections, params),
  getById: (id: number) => get<Section>(`${ENDPOINTS.sections}/${id}`),
  create: (data: SectionInput) => post<Section>(ENDPOINTS.sections, data),
  update: (id: number, data: Partial<SectionInput>) => patch<Section>(`${ENDPOINTS.sections}/${id}`, data),
  delete: (id: number) => del<void>(`${ENDPOINTS.sections}/${id}`),
};

// ─── Teacher Subjects ─────────────────────────────────────────────────────────
export const teacherSubjectsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<PaginatedResponse<TeacherSubject>>(ENDPOINTS.teacherSubjects, params),
  getById: (id: number) => get<TeacherSubject>(`${ENDPOINTS.teacherSubjects}/${id}`),
  create: (data: TeacherSubjectInput) => post<TeacherSubject>(ENDPOINTS.teacherSubjects, data),
  update: (id: number, data: Partial<TeacherSubjectInput>) => patch<TeacherSubject>(`${ENDPOINTS.teacherSubjects}/${id}`, data),
  delete: (id: number) => del<void>(`${ENDPOINTS.teacherSubjects}/${id}`),
};

// ─── Room Schedules (/api/room-schedules) ─────────────────────────────────────
export const roomSchedulesApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<PaginatedResponse<RoomScheduleDetail>>(ENDPOINTS.roomSchedules, params),
  getById: (id: number) => get<RoomSchedule>(`${ENDPOINTS.roomSchedules}/${id}`),
  create: (data: RoomScheduleInput) => post<RoomSchedule>(ENDPOINTS.roomSchedules, data),
  update: (id: number, data: Partial<RoomScheduleInput>) => patch<RoomSchedule>(`${ENDPOINTS.roomSchedules}/${id}`, data),
  delete: (id: number) => del<void>(`${ENDPOINTS.roomSchedules}/${id}`),
};

// ─── Section Subjects ─────────────────────────────────────────────────────────
export const sectionSubjectsApi = {
  getAll: () => get<SectionSubject[]>(ENDPOINTS.sectionSubjects),
  getBySectionId: (sectionId: number) => get<SectionSubject[]>(`${ENDPOINTS.sectionSubjects}?section_id=${sectionId}`),
  create: (data: { section_id: number; subject_id: number; units?: number }) => post<SectionSubject>(ENDPOINTS.sectionSubjects, data),
  bulkAssign: (sectionId: number, assignments: { subject_id: number; units?: number }[]) =>
    request<SectionSubject[]>(`${ENDPOINTS.sectionSubjects}/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify({ assignments }),
    }),
};

// ─── Class Groups (/class-group singular) ─────────────────────────────────────
export const classGroupsApi = {
  getAll: (params?: { page?: number; limit?: number }) => getAll<PaginatedResponse<ClassGroup>>(ENDPOINTS.classGroups, params),
  getById: (id: number) => get<ClassGroup>(`${ENDPOINTS.classGroups}/${id}`),
  create: (data: ClassGroupInput) => post<ClassGroup>(ENDPOINTS.classGroups, data),
  update: (id: number, data: Partial<ClassGroupInput>) => patch<ClassGroup>(`${ENDPOINTS.classGroups}/${id}`, data),
  delete: (id: number) => del<void>(`${ENDPOINTS.classGroups}/${id}`),
};

// ─── Scheduler (Python FastAPI) ──────────────────────────────────────────────
export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface JobResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  message?: string;
}

export interface ProposedClassGroup {
  teacher_subject_id: number;
  section_id: number;
  room_schedule_id: number;
  schedule_time_id: number;
}

export interface ResultResponse {
  job_id: string;
  status: JobStatus;
  class_groups: ProposedClassGroup[];
  total: number;
}

export interface CommitResponse {
  job_id: string;
  committed: number;
  failed: number;
  errors: string[];
}

export interface ScheduleSubject { subject_id: number; units: number; }
export interface ScheduleAssignment { section_id: number; subjects: ScheduleSubject[]; }
export interface GenerateScheduleRequest {
  assignments: ScheduleAssignment[];
  config?: { solver_time_limit_seconds?: number; };
}

export const schedulerApi = {
  generate: (body: GenerateScheduleRequest) =>
    post<JobResponse>(`${SCHEDULER}/api/v1/scheduler/generate`, body),
  getJob: (jobId: string) =>
    get<JobResponse>(`${SCHEDULER}/api/v1/scheduler/jobs/${jobId}`),
  getResult: (jobId: string) =>
    get<ResultResponse>(`${SCHEDULER}/api/v1/scheduler/jobs/${jobId}/result`),
  commit: (jobId: string) =>
    post<CommitResponse>(`${SCHEDULER}/api/v1/scheduler/jobs/${jobId}/commit`, {}),
};

// ─── Local types (mirrors lib/schemas.ts) ─────────────────────────────────────
import type {
  Teacher, Room, Subject, Schedule, Section,
  TeacherSubject, RoomSchedule, RoomScheduleDetail, ClassGroup, ScheduleDetail, ScheduleTime, ScheduleFormInput,
  SectionSubject,
} from './schemas';

type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    itemCount: number;
    totalPages: number;
  };
};
type TeacherInput = Omit<Teacher, 'id'>;
type RoomInput = Omit<Room, 'id'>;
type SubjectInput = Omit<Subject, 'id'>;
type SectionInput = Omit<Section, 'id'>;
type TeacherSubjectInput = Omit<TeacherSubject, 'id'>;
type RoomScheduleInput = Omit<RoomSchedule, 'id'>;
type ClassGroupInput = Omit<ClassGroup, 'id'>;
