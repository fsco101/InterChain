# InterChain

A blockchain-based internship monitoring and performance verification system. Internship activities, attendance, evaluations, and certificates are hashed and stored with tamper-proof blockchain metadata, ensuring immutable records for schools and companies.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.x, Uvicorn |
| Database | MongoDB + Motor (async), JSON fallback |
| Auth | JWT (python-jose), bcrypt |
| Frontend | React 19, Vite, Tailwind CSS |
| State | Zustand, React Context |
| HTTP Client | Axios |
| Media | Cloudinary |
| Email | aiosmtplib |
| PDF | jsPDF + html2canvas |

---

## Roles

- **Student** — intern tracking daily work
- **Instructor** — school-side supervisor managing students
- **Supervisor** — company-side supervisor approving interns
- **Admin** — school administrator with full system access

---

## Current Functionalities

### Authentication (`/auth`)
- Sign up with role selection (student, instructor, supervisor, admin), optional avatar upload
- Log in with email and password → returns JWT
- View own profile (`GET /auth/me`)
- Update own profile including name, email, password, and avatar

---

### Student Portal (`/student`)

| Feature | Description |
|---|---|
| Dashboard | Overview with total activities, cumulative hours logged, and reports submitted with sparkline charts |
| Log Activity | Submit a daily internship activity (date, title, description, hours spent) |
| Log Attendance | Submit daily attendance with time-in, time-out, hours, and optional photo upload |
| Tasks | View and manage tasks assigned by the supervisor |
| Submit Report | Submit a periodic internship report (title, content, internship ID) |
| View Records | Fetch latest 10 activity logs and reports |
| Full History | Fetch all activity logs and reports |
| Delete Record | Delete a single activity or report |
| Bulk Delete | Delete multiple activities or reports at once |
| Search Students | Search students by name, role ID, or internship ID |

---

### Instructor Portal (`/instructor`)

| Feature | Description |
|---|---|
| Dashboard | Overview with quick actions |
| Schedule | View and manage class schedules |
| Hours Tracking | Track and monitor students' logged hours |
| Manage Roster | Add or remove students by Student ID (e.g. `STU-XXXXX`) |
| View Roster | List all students under the instructor |
| Validate Attendance | Record student attendance (present/absent/late) with date |
| Submit Evaluation | Submit a performance score (0–10) with remarks for a student |
| Rankings | View student rankings based on evaluations and hours |
| View Records | Fetch latest attendance records and evaluations |
| Full History | Fetch all attendance records and evaluations |
| Delete Record | Delete a single attendance or evaluation record |
| Bulk Delete | Delete multiple records at once |
| Search Users | Search students or other users by name, role ID, email, or internship ID |

---

### Supervisor Portal (`/supervisor`)

| Feature | Description |
|---|---|
| Dashboard | Overview with quick actions |
| Manage Tasks | Create, assign, and update tasks for students |
| Intern Roster | Manage and view the list of interns under supervision |
| Manage Roster | Add or remove instructors by Instructor ID (e.g. `INS-XXXXX`) |
| View Roster | View all linked instructors and their student rosters |
| Submit Evaluation | Submit a performance score (0–10) with remarks for a student |
| Approve Completion | Record internship completion approval or rejection for a student |
| View Records | Fetch latest completion approvals and evaluations |
| Full History | Fetch all completion approvals and evaluations |
| Delete Record | Delete a single approval or evaluation |
| Bulk Delete | Delete multiple records at once |
| Student Rankings | Rank students by performance scores and tasks completed |
| Issue Certificate | Generate a blockchain-verified internship certificate (A4 landscape) with live preview, optional company logo, signatory details, and remarks |
| Email Certificate | Automatically send the rendered certificate HTML to the recipient's email on issuance |
| Download Certificate PDF | Export the certificate as a PDF locally |
| Certificate History | View all previously issued certificates with blockchain transaction hash links |
| Search Users | Search students or instructors by name, role ID, or email |

---

### Admin Portal (`/admin`)

| Feature | Description |
|---|---|
| Dashboard | System-wide counts: users, activity logs, reports, attendance records, evaluations, completion approvals |
| Review Records | Aggregated view of the latest 50 records across all collections |
| List Users | View all registered users |
| Create User | Register a new user with any role and optional avatar |
| Update User | Edit any user's name, email, password, role, and avatar |
| Patch Role | Change a user's role without a full update |
| Delete User | Remove a user (cannot delete own account) |
| Backfill Role IDs | One-time migration to assign role IDs to users missing them |

---

### Notifications (`/notifications`)

- In-app notifications pushed automatically on key actions (activity logged, report submitted, attendance recorded, evaluation submitted, approval saved)
- List all notifications with unread count
- Mark a single notification as read
- Mark all notifications as read
- Delete a single notification
- Bulk delete notifications

---

### Blockchain & IPFS Integration

Every record creation (activity, report, attendance, evaluation, approval, certificate) generates a SHA-256 transaction hash from a canonical payload and stores metadata inline. The system features an **IPFS Records Viewer** (`/ipfs-records`) to browse and verify decentralized records securely.

```
tx_hash, explorer_url, network, recorded_at, status
```

Records link to a configurable blockchain explorer URL and IPFS gateway for verification.

---

### Supporting Features

- **Fallback Storage** — JSON file-based storage (`data/fallback_db.json`) when MongoDB is unavailable, with the same API interface
- **Role IDs** — Auto-generated unique IDs per role (`STU-XXXXX`, `INS-XXXXX`, etc.)
- **Internship ID Search** — Cross-collection search for internship IDs used across all record types
- **Avatar Upload** — Cloudinary-hosted profile avatars
- **Profile Page** — All roles can update their own profile
- **Protected Routes** — Role-based access enforced on both frontend and backend
- **Philippine Schools List** — Preloaded institution list for student/instructor signup

---

## Project Structure

```
InterChain/
├── backend/
│   ├── app/
│   │   ├── routers/      # auth, student, instructor, supervisor, admin, records, notifications
│   │   ├── services/     # auth_service, records_service, blockchain_service, email_service, cloudinary_service
│   │   ├── schemas/      # Pydantic models (auth, records)
│   │   ├── db/           # MongoDB connection + JSON fallback
│   │   ├── utils/        # security (JWT)
│   │   └── deps.py       # require_roles dependency
│   └── data/fallback_db.json
└── frontend/
    └── src/
        ├── pages/        # student/, instructor/, supervisor/, admin/, auth/, LandingPage, ProfilePage, IpfsViewerPage
        ├── components/   # DashboardShell, ProtectedRoute, SearchFields, Notifications, ...
        ├── api/          # axios client functions per domain
        ├── context/      # AuthContext, NotificationContext
        └── utils/        # alerts.js, validation.js
```

---

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment
- `backend/.env` — MongoDB URI, JWT secret, Cloudinary keys, blockchain config, SMTP settings
- `frontend/.env` — API base URL
