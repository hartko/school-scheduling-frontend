# School Scheduling System

A production-grade Next.js 14 (TypeScript) frontend for managing school schedules.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Validation | Zod |
| Forms | React Hook Form + @hookform/resolvers |
| Icons | Lucide React |
| CSV Parsing | PapaParse |

## Project Structure

```
school-scheduler/
├── app/
│   ├── (dashboard)/          # Protected layout with sidebar + navbar
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Dashboard home
│   │   ├── teachers/
│   │   ├── rooms/
│   │   ├── subjects/
│   │   ├── schedules/
│   │   ├── sections/
│   │   ├── teacher-subjects/
│   │   ├── room-schedules/
│   │   └── class-groups/
│   ├── login/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx         # Reusable button with variants
│   │   ├── TextField.tsx      # TextField, SelectField, CheckboxField
│   │   └── Modal.tsx          # Modal + ConfirmDialog
│   ├── tables/
│   │   ├── DataTable.tsx      # Sortable, searchable, paginated table
│   │   └── MassUpload.tsx     # CSV mass upload with validation
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Navbar.tsx
│       └── PageHeader.tsx
├── lib/
│   ├── schemas.ts             # All Zod schemas
│   ├── store.ts               # In-memory CRUD store (replace with API)
│   └── utils.ts               # cn, paginate, formatTime, downloadCSV
└── types/
```

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

**Demo credentials:** Any email + password (6+ chars)

## Pages

| Route | Description |
|---|---|
| `/login` | Authentication |
| `/teachers` | CRUD + Mass Upload |
| `/rooms` | CRUD + Mass Upload |
| `/subjects` | CRUD + Mass Upload |
| `/schedules` | CRUD + Mass Upload |
| `/sections` | CRUD + Mass Upload |
| `/teacher-subjects` | Assign subjects to teachers |
| `/room-schedules` | Assign schedules to rooms |
| `/class-groups` | Assign teacher-subject + room-schedule + section |

## Key Features

- ✅ Zod validation on all forms and CSV imports
- ✅ Searchable, sortable, paginated DataTable
- ✅ CSV mass upload with row-level error reporting
- ✅ CSV export on every resource page
- ✅ Responsive layout (sidebar collapses on mobile)
- ✅ Confirm dialogs on delete
- ✅ Breadcrumb navigation in navbar
- ✅ Reusable UI primitives: Button, TextField, SelectField, Modal

## Connecting a Real Backend

Replace the mock stores in `lib/store.ts` with API calls:

```typescript
// Example: Replace teacherStore.getAll() with
const teachers = await fetch('/api/teachers').then(r => r.json());
```

All Zod schemas in `lib/schemas.ts` are ready for both client-side form validation and API response parsing.

## API Integration

All pages connect to your NestJS backend at `http://localhost:4000`.

### Endpoint Map

| Page | Endpoints Used |
|---|---|
| Teachers | `GET/POST /teachers`, `PATCH/DELETE /teachers/:id` |
| Rooms | `GET/POST /rooms`, `PATCH/DELETE /rooms/:id` |
| Subjects | `GET/POST /subjects`, `PATCH/DELETE /subjects/:id` |
| Schedules | `GET/POST /schedules`, `PATCH/DELETE /schedules/:id` |
| Sections | `GET/POST /sections`, `PATCH/DELETE /sections/:id` |
| Teacher Subjects | `GET/POST /teacher-subjects`, `DELETE /teacher-subjects/:id` |
| Room Schedules | `GET/POST /api/room-schedules`, `DELETE /api/room-schedules/:id` |
| Class Groups | `GET/POST /class-group`, `PATCH/DELETE /class-group/:id` |

> ⚠️ Note the differences: `room-schedules` uses `/api/` prefix, `class-group` is singular.

### Enable CORS in NestJS

Add this to your `main.ts` so the frontend can talk to the backend:

```ts
app.enableCors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
});
```

## API Integration

All pages now connect to your NestJS backend at `http://localhost:4000`.

### Endpoint Map

| Entity | Base URL | Note |
|---|---|---|
| Teachers | `http://localhost:4000/teachers` | |
| Rooms | `http://localhost:4000/rooms` | |
| Subjects | `http://localhost:4000/subjects` | |
| Schedules | `http://localhost:4000/schedules` | |
| Sections | `http://localhost:4000/sections` | |
| Teacher Subjects | `http://localhost:4000/teacher-subjects` | |
| Room Schedules | `http://localhost:4000/api/room-schedules` | Has `/api/` prefix |
| Class Groups | `http://localhost:4000/class-group` | Singular, no 's' |

All updates use **PATCH** (not PUT), matching your NestJS controllers.

### Enable CORS in NestJS

Add this to your `main.ts` so the frontend can call the API:

```ts
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  await app.listen(4000);
}
```
