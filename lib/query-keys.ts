export const queryKeys = {
  teachers: {
    all: () => ['teachers'] as const,
    list: (p?: object) => ['teachers', 'list', p] as const,
    detail: (id: string) => ['teachers', 'detail', id] as const,
  },
  rooms: {
    all: () => ['rooms'] as const,
    list: (p?: object) => ['rooms', 'list', p] as const,
    detail: (id: string) => ['rooms', 'detail', id] as const,
  },
  subjects: {
    all: () => ['subjects'] as const,
    list: (p?: object) => ['subjects', 'list', p] as const,
    detail: (id: string) => ['subjects', 'detail', id] as const,
  },
  schedules: {
    all: () => ['schedules'] as const,
    list: (p?: object) => ['schedules', 'list', p] as const,
    detail: (id: string) => ['schedules', 'detail', id] as const,
  },
  sections: {
    all: () => ['sections'] as const,
    list: (p?: object) => ['sections', 'list', p] as const,
    detail: (id: string) => ['sections', 'detail', id] as const,
  },
  teacherSubjects: {
    all: () => ['teacher-subjects'] as const,
    list: (p?: object) => ['teacher-subjects', 'list', p] as const,
    detail: (id: string) => ['teacher-subjects', 'detail', id] as const,
  },
  roomSchedules: {
    all: () => ['room-schedules'] as const,
    list: (p?: object) => ['room-schedules', 'list', p] as const,
    detail: (id: string) => ['room-schedules', 'detail', id] as const,
  },
  classGroups: {
    all: () => ['class-groups'] as const,
    list: (p?: object) => ['class-groups', 'list', p] as const,
    detail: (id: string) => ['class-groups', 'detail', id] as const,
  },
} as const;
