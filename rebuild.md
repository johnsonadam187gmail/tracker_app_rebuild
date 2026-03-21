# CKB Tracker - Rebuild Specification

## Overview

**CKB Tracker** is a martial arts attendance tracking application built with FastAPI (backend), Streamlit (frontend), and SQLite (database). The application manages student attendance, class scheduling, curriculum/lesson management, teacher assignments, and provides analytics dashboards for students, teachers, and administrators.

---

## Current Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI 0.127.0+ with Uvicorn |
| Database | SQLite with SQLAlchemy 2.0+ ORM |
| Frontend | Streamlit 1.52.2+ |
| Validation | Pydantic v2 |
| Authentication | JWT tokens with Passlib/Argon2 |
| Photo Storage | Cloudinary |
| Charts | Plotly |

---

## Target Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14+ with React |
| Backend | Next.js API Routes (or separate FastAPI) |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth |
| Photo Storage | Supabase Storage |
| Deployment | Netlify |

---

## Application Features Summary

### Core Features
1. **Student Check-In System** - Students search for themselves and check into classes
2. **Mat-Side Workflow** - Students check in (pending), teachers confirm (confirmed)
3. **User Management** - Create/edit members with profile photos, ranks, grading dates
4. **Class Scheduling** - Recurring classes with day/time/points/gym/class type
5. **Role-Based Access** - Student, Teacher, Admin roles with historical tracking (SCD Type 2)
6. **Password Authentication** - Students can log in to view personal analytics
7. **Teacher Dashboard** - Confirm attendance, assign teachers to classes, view feedback
8. **Curriculum & Lessons** - Create curricula for classes, build lesson libraries, assign lessons to dates
9. **Class Feedback** - Students rate classes (thumbs up/down) with optional comments
10. **Term & Targets** - Define training terms with attendance targets per rank
11. **Analytics** - Student performance, teacher performance, admin feedback analytics
12. **Kiosk Mode** - PIN-protected self check-in for tablets at the gym
13. **Database Management** - Backup, restore, seed data, reset functionality

---

## Page Catalogue

### 1. Attendance Page (Main/Home) - `Attendance.py`
**URL Pattern:** `/` (root)

**Layout:**
- **Sidebar:**
  - Theme toggle (dark/light)
  - Profile photo capture/upload section
  - Add New Member form (first name, last name, email, password, confirm password, nicknames, rank, last grading date, comments)

**Main Content:**
- **Before Login:** 
  - Date display
  - User search box (minimum 2 characters)
  - Search results with profile photos, name, email, "Select" button
  
- **After Login (Dashboard):**
  - Student info header (photo, name, email)
  - Session timeout countdown (2 minutes)
  - Class list with check-in status:
    - Not Checked In: "✅ Check In" button
    - Pending: "⏳ Pending" with "🗑️ Cancel" button
    - Confirmed: "✅ Confirmed" (disabled)
  - "✅ Complete - Done" button
  - "🔄 Start Over - New Student" button (with confirmation)

---

### 2. Student Analytics Page - `pages/2_Student_Analytics.py`
**URL Pattern:** `/student-analytics` (Streamlit multi-page)

**Authentication:** Email/password login required

**Layout:**
- **Login Form:**
  - Email input
  - Password input
  - Login button
  
- **Main Content (after login):**
  - Welcome header with user name
  - Logout button in sidebar
  - Quick info (email, rank, nickname)

**Tabs:**

#### Tab 1: My Analytics (`📊 My Analytics`)
- **Metrics Row:**
  - Total Classes
  - Total Points
  - Classes This Month
  - Last Class (days ago)

- **Charts:**
  - Attendance Trend (Last 90 Days) - Bar chart showing classes per day

- **Data Table:**
  - Recent Attendance History (Date, Class, Points, Teacher) - last 20 records

#### Tab 2: Submit Feedback (`💬 Submit Feedback`)
- **Instructions:** Feedback must be submitted within 7 days of attending
- **Classes Awaiting Feedback:** Expandable list showing:
  - Class name, date, teacher
  - Rating radio (👍 Thumbs Up / 👎 Thumbs Down)
  - Comment text area
  - Submit button
- **Submitted Feedback:** List of past feedback with rating, comment, date

---

### 3. Teacher Dashboard - `pages/3_Teacher.py`
**URL Pattern:** `/teacher` (Streamlit multi-page)

**Authentication:** Teacher JWT token login required

**Login Form:**
- Email input
- Password input
- Login button

**Main Content (after login):**
- Header with teacher name
- Logout button in sidebar

**Tabs:**

#### Tab 1: Confirm Attendance (`✅ Confirm Attendance`)
- **Controls:**
  - Date picker (default: today)
  - Class dropdown selector
  - Auto-refresh checkbox (5 seconds)
  - Manual "🔄 Refresh Now" button

- **Metrics:**
  - Total Students
  - ⏳ Pending
  - ✅ Confirmed

- **Student List:**
  - Checkbox (for pending only)
  - Student photo + name
  - Check-in time
  - Status (Pending/Confirmed)
  - Action buttons: "✓ Confirm", "✕ Remove"

- **Bulk Actions:**
  - "✅ Confirm All Selected" button
  - "🗑️ Remove All Selected" button

- **Bottom:** "✅ CONFIRM ALL PENDING" button

- **Add Student Manually (Expander):**
  - Student dropdown
  - "Add & Confirm" button

#### Tab 2: Class Roster (`📋 Class Roster`)
- **Controls:**
  - Date picker
  - Class dropdown
  - Teacher dropdown (pre-selects logged-in teacher)
  - "💾 Assign Teacher" button

- **Student Roster Table:**
  - Name, Rank, Check-in Time
  - Total Attendees count

#### Tab 3: Feedback (`💬 Feedback`)
- **Filters (Expander):**
  - Date Range picker
  - Classes multiselect
  - Rating dropdown (All/Positive/Negative)

- **Metrics:**
  - Total Feedback
  - 👍 Positive count
  - 👎 Negative count

- **Feedback Table (Anonymous - no student names):**
  - Date, Class, Lesson, Rating, Comment

---

### 4. Settings/Admin Page - `pages/4_Settings.py`
**URL Pattern:** `/settings` (Streamlit multi-page)

**Authentication:** Simple password (hardcoded: admin/ckb2026)

**Tabs:**

#### Tab 1: User Admin (`🥋 User Admin`)
- **Search:** Filter by name, rank, or email
- **Stats:** Total Active Members metric
- **Table:** Members list (first name, last name, rank, email, created date)

- **Edit Member Form:**
  - First name, Last name
  - Rank dropdown (White/Blue/Purple/Brown/Black)
  - Email
  - Nicknames
  - Last Graded Date
  - "Save Changes & Archive History" button

- **Role Management Section:**
  - Current roles display
  - Checkboxes for role assignment
  - "Update Roles" button
  - Role history (collapsible)

- **Reset Password Section:**
  - New Password input
  - Confirm Password input
  - "🔄 Reset Password" button

- **Photo Management Section:**
  - Current photo display
  - Photo method radio (Upload/Take Photo)
  - Camera input / File uploader
  - "📤 Update Photo" button
  - "🗑️ Delete Photo" button

#### Tab 2: Class Schedule (`📅 Class Schedule`)
- **Add New Class Form:**
  - Class Name
  - Day dropdown
  - Time input
  - Weighting (points) number
  - Gym Location dropdown
  - Class Type dropdown

- **Table:** Active schedule (Class Name, Day, Time, Points)

#### Tab 3: Gyms & Types (`🏢 Gyms & Types`)
- **Gym Locations:**
  - Add form (Name, Address)
  - Table display

- **Class Types:**
  - Add form (Type name)
  - Table display

#### Tab 4: Terms (`🗓️ Terms`)
- **Add Term Form:**
  - Term Name
  - Start Date
  - End Date
- **Table:** Terms list

#### Tab 5: Targets (`🎯 Targets`)
- **Add Target Form:**
  - Term dropdown
  - Target Rank dropdown
  - Hours Required number
- **Table:** Targets list

#### Tab 6: Lessons (`📚 Lessons`)
**Sub-tabs:**

##### Subtab 1: Curricula (`📖 Curricula`)
- **Create Curriculum Form:**
  - Class dropdown
  - Curriculum Name (optional)
  - Description (optional)
- **Table:** Existing curricula (Class, Name, Description)
- **Edit/Delete:** Expander with curriculum selector

##### Subtab 2: Lesson Library (`📝 Lesson Library`)
- **Create Lesson Form:**
  - Curriculum dropdown
  - Lesson Title
  - Description
  - Lesson Plan URL
  - Video Folder URL
- **Filter:** By Curriculum dropdown
- **Table:** Lessons (Class, Curriculum, Title, Description)
- **Edit/Delete:** Expander

##### Subtab 3: Assign to Dates (`📅 Assign to Dates`)
- **Assignment Form:**
  - Class dropdown
  - Date picker
  - Lesson dropdown
  - Teacher dropdown
  - "💾 Save Assignment" button
- **Table:** Current assignments with filters

##### Subtab 4: Teacher Assignments (`👨‍🏫 Teacher Assignments`)
- **Assignment Form:**
  - Class dropdown
  - Date picker
  - Teacher dropdown
  - "💾 Save Teacher Assignment" button
- **Table:** Teacher assignments with filters
- **Metrics:** Total Instances, Teachers Assigned, Unique Teachers

#### Tab 7: Student Passwords (`🔐 Student Password Management`)
- **Set/Update Password Form:**
  - Student dropdown
  - Password input
  - Confirm Password input
- **Password Status Table:**
  - Name, Email, Status (✅ Active / ❌ No Password)
  - "🗑️ Remove" button
- **Instructions:** How password system works

#### Tab 8: Performance Analytics (`📈 Performance Analytics`)
- **Filters:**
  - Student dropdown
  - Term dropdown (includes "All Time")

- **Student Analytics View:**
  - Student name and rank header
  - Metrics: Total Mat Points, Total Sessions
  - Gauge chart: Points vs Target
  - Charts:
    - Attendance History (Cumulative Points)
    - Class Distribution (Pie chart)
  - Detailed Attendance Log table

- **Teacher Analytics View (if user has Teacher role):**
  - Metrics: Classes Taught, Total Students, Avg Students/Class
  - Charts:
    - Classes Taught by Type (Bar)
    - Student Attendance Trend (Line)
  - Teaching Log table

#### Tab 9: Feedback Analytics (`📊 Comprehensive Feedback Analytics`)
- **Metrics:**
  - Total Feedback
  - 👍 Positive %
  - Most Active (student)
  - Avg Rating %

- **Filters:**
  - Date Range
  - Classes (multiselect)
  - Teachers (multiselect)
  - Rating (All/Positive/Negative)

- **Data Table:** Date, Class, Student, Teacher, Rating, Comment

- **Charts:**
  - Feedback Over Time (Line)
  - Feedback by Class (Bar)
  - Feedback by Teacher (Bar)
  - Rating Distribution (Pie)

- **Export:** "📥 Download Feedback CSV" button

#### Tab 10: Kiosk Management (`📱 Kiosk PIN Management`)
- **Current PIN Display:** Default PIN: 1234
- **Change PIN Form:**
  - Current PIN input
  - New PIN input (4-6 digits)
  - Confirm New PIN input
- **How It Works Instructions**

#### Tab 11: Database (`🗄️ Database Management`)
- **Statistics:**
  - Database Size
  - Total Records
  - Users count
  - Attendance count

- **Export:**
  - "📦 Create Seed File" button
  - "💾 Create Backup" button
  - Available seeds/backups list with download buttons

- **Restore:**
  - Upload file method
  - From existing backup/seed method

- **Reset Database:**
  - Empty (roles only)
  - Load from seed file

- **Scheduled Backups Instructions**

---

## Data Model

### Entity Relationship Diagram (PostgreSQL/Supabase)

```mermaid
erDiagram
    User ||--o{ UserRole : has
    User ||--o{ FactAttendance : attends
    User ||--o{ ClassFeedback : provides
    Role ||--o{ UserRole : assigned_to
    ClassSchedule ||--o{ FactAttendance : has
    ClassSchedule ||--o{ Curriculum : has_one
    ClassSchedule ||--o{ ClassInstance : occurs_as
    Curriculum ||--o{ Lesson : contains
    Lesson ||--o{ ClassInstance : assigned_to
    ClassInstance ||--o{ FactAttendance : contains
    ClassInstance ||--o{ ClassFeedback : receives
    GymLocation ||--o{ ClassSchedule : hosts
    ClassType ||--o{ ClassSchedule : categorizes
    Term ||--o{ TermTarget : defines
    UserRole ||--o{ FactAttendance : recorded_as

    User {
        uuid user_uuid PK
        string first_name
        string last_name
        string email
        string password_hash
        string rank
        date last_graded_date
        text comments
        text nicknames
        string profile_image_url
        boolean is_current
        timestamptz effective_date
        timestamptz end_date
        timestamptz created_date
        timestamptz updated_date
    }

    Role {
        int id PK
        string name UK
        text description
    }

    UserRole {
        int id PK
        uuid user_uuid FK
        int role_id FK
        boolean is_current
        timestamptz effective_date
        timestamptz end_date
        timestamptz created_date
        timestamptz updated_date
    }

    ClassSchedule {
        int id PK
        uuid class_uuid
        string class_name
        string day
        string time
        text description
        float points
        int gym_id FK
        int class_type_id FK
        boolean is_current
        timestamptz effective_date
        timestamptz end_date
        timestamptz created_date
    }

    ClassInstance {
        int id PK
        int class_id FK
        date class_date
        uuid teacher_uuid FK
        int lesson_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    Curriculum {
        int id PK
        int class_id FK UK
        string name
        text description
        timestamptz created_at
        timestamptz updated_at
    }

    Lesson {
        int id PK
        int curriculum_id FK
        string title
        text description
        string lesson_plan_url
        string video_folder_url
        timestamptz created_at
        timestamptz updated_at
    }

    FactAttendance {
        int id PK
        uuid user_uuid FK
        int class_id FK
        int class_instance_id FK
        uuid teacher_uuid FK
        int user_role_id FK
        date attendance_date
        timestamptz created_at
        string status
        uuid confirmed_by
        timestamptz confirmed_at
    }

    ClassFeedback {
        int id PK
        uuid user_uuid FK
        int attendance_id FK
        int class_instance_id FK
        string rating
        text comment
        timestamptz created_at
        timestamptz updated_at
    }

    GymLocation {
        int id PK
        string name UK
        string address
    }

    ClassType {
        int id PK
        string name UK
    }

    Term {
        int id PK
        string term_name UK
        date start_date
        date end_date
        timestamptz created_at
    }

    TermTarget {
        int id PK
        int term_id FK
        string rank
        float target
    }

    KioskAuth {
        int id PK
        string pin_hash
        timestamptz created_at
        timestamptz updated_at
    }
```

### Key Constraints (PostgreSQL)

```sql
-- User SCD Type 2
CREATE UNIQUE INDEX uix_user_current ON users(user_uuid) WHERE is_current = true;

-- Attendance unique per student per class per day
CREATE UNIQUE INDEX uix_user_class_date ON attendance(user_uuid, class_id, attendance_date);

-- ClassInstance unique per class per day
CREATE UNIQUE INDEX uix_class_date ON class_instances(class_id, class_date);

-- One curriculum per class
CREATE UNIQUE INDEX uix_class_curriculum ON curricula(class_id);

-- One feedback per attendance
CREATE UNIQUE INDEX uix_attendance_feedback ON class_feedback(attendance_id);
```

---

## API Endpoints Summary

#### 1. Hardcoded Admin Credentials (CRITICAL) - ✅ FIXED
**Location:** Previously in `pages/4_Settings.py`
**Issue:** Credentials were hardcoded in the source code.
**Resolution:** Replaced with proper JWT/cookie-based authentication via API. Admin now uses `admin@example.com/admin123` with proper auth flow.
**Note:** The old Streamlit version still has this issue; this applies to the Next.js rebuild only.
- `POST /auth/login` - Student login (sets httpOnly cookies)
- `POST /auth/teacher-login` - Teacher login (sets httpOnly cookies)
- `GET /auth/me` - Get current user (requires valid access cookie)
- `POST /auth/refresh` - Refresh access token (uses refresh cookie)
- `POST /auth/logout` - Clear session cookies
- `POST /auth/logout-all` - Clear all user sessions
- `GET /auth/csrf-token` - Get CSRF token
- `POST /auth/verify-session` - Verify and extend JWT (legacy)
- `POST /auth/set-password` - Admin sets user password
- `GET /auth/check-password/{uuid}` - Check if user has password
- `DELETE /auth/remove-password/{uuid}` - Remove user password

### Users
- `GET /users/` - List all users
- `POST /users/` - Create user (with optional photo)
- `GET /users/{uuid}` - Get user by UUID
- `PUT /users/{uuid}` - Update user (SCD Type 2)
- `DELETE /users/{uuid}/photo` - Delete user photo
- `POST /users/{uuid}/photo` - Upload photo
- `GET /users/search` - Search users

### Classes
- `GET /classes/` - List all classes
- `POST /classes/` - Create class
- `GET /classes/{id}` - Get class
- `PUT /classes/{uuid}` - Update class (SCD Type 2)

### Class Instances
- `GET /class-instances/` - List with filters
- `POST /class-instances/` - Create instance
- `GET /class-instances/by-date/` - Get by class and date
- `PUT /class-instances/{id}` - Update instance

### Attendance
- `GET /attendance/user/{uuid}` - User's attendance
- `GET /attendance/class/{id}` - Class attendance
- `POST /attendance/check-in` - Student self check-in
- `POST /attendance/direct` - Teacher direct attendance
- `POST /attendance/{id}/confirm` - Teacher confirms
- `DELETE /attendance/{id}/cancel` - Cancel check-in
- `POST /attendance/bulk-confirm` - Bulk confirm

### Terms & Targets
- `GET /terms/` - List terms
- `POST /terms/` - Create term
- `GET /term-targets/` - List targets
- `POST /term-targets/` - Create target

### Roles
- `GET /roles/` - List roles
- `GET /roles/user/{uuid}` - User's current roles
- `PUT /roles/user/{uuid}` - Update user roles
- `GET /roles/user/{uuid}/history` - Role history
- `GET /roles/users/by-role/{role}` - Users with role

### Curricula & Lessons
- `GET /curricula/` - List curricula
- `POST /curricula/` - Create curriculum
- `GET /lessons/` - List lessons
- `POST /lessons/` - Create lesson
- `PUT /lessons/{id}` - Update lesson
- `DELETE /lessons/{id}` - Delete lesson

### Feedback
- `POST /feedback/` - Submit feedback
- `GET /feedback/user/{uuid}` - User's feedback
- `GET /feedback/teacher/{uuid}` - Teacher's feedback (anonymous)
- `GET /feedback/admin/comprehensive-stats` - Admin view

### Kiosk
- `POST /kiosk/verify-pin` - Verify kiosk PIN
- `PUT /kiosk/update-pin` - Update kiosk PIN
- `POST /kiosk/setup` - Initialize kiosk

### Database
- `GET /database/stats` - Database statistics
- `POST /database/export-seed` - Export seed file
- `POST /database/create-backup` - Create backup
- `POST /database/restore` - Restore from file
- `POST /database/reset` - Reset database

---

## Security Assessment

### Current Security Issues

#### 1. Hardcoded Admin Credentials (CRITICAL) - ✅ FIXED (Next.js)
**Location:** Previously in `pages/4_Settings.py` (Streamlit) and login forms
**Issue:** Credentials were hardcoded in the source code.
**Resolution (Next.js):**
- Replaced with proper JWT/cookie-based authentication via API
- Admin now uses `admin@example.com/admin123` with proper auth flow
- Session tokens stored server-side in database
- Tokens can be revoked server-side
- Note: The old Streamlit version still has this issue

#### 2. Kiosk PIN Not Protected from Brute Force (HIGH)
**Location:** `app/routers/kiosk.py`
**Issue:** No rate limiting on PIN verification endpoint. An attacker could brute-force the 4-6 digit PIN.
**Recommendation:**
- Implement rate limiting (e.g., 5 attempts per minute)
- Add account lockout after failed attempts
- Use Supabase RLS for kiosk mode

#### 3. No HTTPS Enforcement (HIGH)
**Issue:** The app runs over HTTP in development. In production, sensitive data (passwords, JWT tokens) could be intercepted.
**Status:** Partially addressed with httpOnly cookies
**Recommendation:**
- Enforce HTTPS in production (Netlify provides this)
- Set secure cookie flags (HttpOnly, Secure, SameSite)
- Use HTTPS redirects

#### 4. JWT Token Storage (MEDIUM) - ✅ FIXED (Next.js)
**Location:** Previously localStorage, now httpOnly cookies
**Issue:** Tokens stored in localStorage were vulnerable to XSS attacks.
**Resolution (Next.js):**
- Access tokens stored in httpOnly cookies (JS cannot read)
- Refresh tokens stored in httpOnly cookies with restricted path
- CSRF protection via double-submit cookie pattern
- Token revocation supported via server-side SessionToken table

#### 5. No Input Sanitization (MEDIUM)
**Issue:** User inputs (comments, nicknames, etc.) are stored and displayed without sanitization.
**Recommendation:**
- Implement proper XSS protection
- Use React's built-in escaping in Next.js
- Sanitize rich text content if allowed

#### 6. Password Requirements (LOW-MEDIUM)
**Location:** `pages/4_Settings.py` and `app/auth.py`
**Issue:** Password validation exists but the requirements are complex. New users can have weak passwords initially.
**Recommendation:**
- Enforce password strength requirements consistently
- Use Supabase Auth's built-in password policies

#### 7. No Role-Based API Enforcement (MEDIUM)
**Location:** Most API endpoints
**Issue:** Many endpoints don't verify user roles before allowing actions. For example, any authenticated user might access admin endpoints.
**Recommendation:**
- Implement proper middleware for role verification
- Use Supabase RLS policies for row-level security

---

## Migration & Rebuild Plan

### Priority Order

1. **Create frontend with local test database**
2. **Deploy/create database assets**
3. **Deploy frontend to Netlify**
4. **Full app security and functional testing**

---

### Phase 1: Frontend Development (Priority 1)

#### 1.1 Setup Next.js Project
```bash
npx create-next-app@latest ckb-tracker --typescript --tailwind --eslint
cd ckb-tracker

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install chart.js react-chartjs-2
npm install date-fns
npm install lucide-react
npm install axios
```

#### 1.2 Project Structure
```
ckb-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Main attendance/check-in
│   │   ├── globals.css
│   │   ├── login/
│   │   │   └── page.tsx          # Student login
│   │   ├── teacher/
│   │   │   └── page.tsx          # Teacher dashboard
│   │   ├── admin/
│   │   │   └── page.tsx          # Admin settings
│   │   └── api/
│   │       └── [...supabase]/    # Supabase auth handler
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── attendance/           # Check-in components
│   │   ├── analytics/            # Charts and stats
│   │   ├── forms/                # Form components
│   │   └── layout/               # Layout components
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── api.ts                # API helpers
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   └── hooks/
│       └── useAuth.ts            # Auth hooks
├── public/
├── .env.local
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

#### 1.3 Build Pages (Replicating Streamlit Pages)

**Main Attendance Page (`/`)**
- User search with debounced input
- Student dashboard with class list
- Session timeout handling
- Theme toggle

**Student Login (`/login`)**
- Email/password form
- Supabase Auth integration

**Student Portal (`/portal`)**
- Tab 1: My Analytics (charts, tables)
- Tab 2: Submit Feedback

**Teacher Dashboard (`/teacher`)**
- JWT/Supabase Auth required
- Tab 1: Confirm Attendance
- Tab 2: Class Roster
- Tab 3: Feedback

**Admin Settings (`/admin`)**
- Tab 1: User Admin
- Tab 2: Class Schedule
- Tab 3: Gyms & Types
- Tab 4: Terms
- Tab 5: Targets
- Tab 6: Lessons (4 subtabs)
- Tab 7: Student Passwords
- Tab 8: Performance Analytics
- Tab 9: Feedback Analytics
- Tab 10: Kiosk Management
- Tab 11: Database

#### 1.4 Local Development with Test Data
- Use SQLite locally for initial development
- Run `python reset_db.py` and `python seed_complete_data.py`
- Test all pages and functionality
- Ensure responsive design works

---

### Phase 2: Database Setup (Priority 2)

#### 2.1 Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Note down:
   - Project URL
   - Anon public key
   - Service role key (keep secret!)

#### 2.2 Database Schema
Run the following SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE attendance_status AS ENUM ('pending', 'confirmed');
CREATE TYPE feedback_rating AS ENUM ('thumbs_up', 'thumbs_down');

-- Gym Locations
CREATE TABLE gym_locations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    address TEXT
);

-- Class Types
CREATE TABLE class_types (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('Student', 'Regular student member'),
('Teacher', 'Instructor who teaches classes'),
('Admin', 'Administrator with full access');

-- Users (SCD Type 2)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT,
    rank TEXT,
    last_graded_date DATE,
    comments TEXT,
    nicknames TEXT,
    profile_image_url TEXT,
    is_current BOOLEAN DEFAULT true,
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX uix_user_current ON users(user_uuid) WHERE is_current = true;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(last_name, first_name);

-- User Roles (SCD Type 2)
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL REFERENCES users(user_uuid),
    role_id INTEGER NOT NULL REFERENCES roles(id),
    is_current BOOLEAN DEFAULT true,
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user ON user_roles(user_uuid);
CREATE INDEX idx_user_roles_current ON user_roles(user_uuid) WHERE is_current = true;

-- Class Schedules (SCD Type 2)
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    class_uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    class_name TEXT NOT NULL,
    day TEXT,
    time TEXT,
    description TEXT,
    points REAL DEFAULT 1.0,
    gym_id INTEGER REFERENCES gym_locations(id),
    class_type_id INTEGER REFERENCES class_types(id),
    is_current BOOLEAN DEFAULT true,
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classes_name ON classes(class_name);

-- Terms
CREATE TABLE terms (
    id SERIAL PRIMARY KEY,
    term_name TEXT UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Term Targets
CREATE TABLE term_targets (
    id SERIAL PRIMARY KEY,
    term_id INTEGER NOT NULL REFERENCES terms(id),
    rank TEXT NOT NULL,
    target REAL NOT NULL,
    UNIQUE(term_id, rank)
);

-- Curricula
CREATE TABLE curricula (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) UNIQUE,
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    curriculum_id INTEGER NOT NULL REFERENCES curricula(id),
    title TEXT NOT NULL,
    description TEXT,
    lesson_plan_url TEXT,
    video_folder_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_curriculum ON lessons(curriculum_id);

-- Class Instances
CREATE TABLE class_instances (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    class_date DATE NOT NULL,
    teacher_uuid UUID REFERENCES users(user_uuid),
    lesson_id INTEGER REFERENCES lessons(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, class_date)
);

CREATE INDEX idx_class_instances_class ON class_instances(class_id);
CREATE INDEX idx_class_instances_date ON class_instances(class_date);
CREATE INDEX idx_class_instances_teacher ON class_instances(teacher_uuid);

-- Attendance
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL REFERENCES users(user_uuid),
    class_id INTEGER NOT NULL REFERENCES classes(id),
    class_instance_id INTEGER REFERENCES class_instances(id),
    teacher_uuid UUID REFERENCES users(user_uuid),
    user_role_id INTEGER REFERENCES user_roles(id),
    attendance_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status attendance_status DEFAULT 'confirmed',
    confirmed_by UUID REFERENCES users(user_uuid),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(user_uuid, class_id, attendance_date)
);

CREATE INDEX idx_attendance_user ON attendance(user_uuid);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_instance ON attendance(class_instance_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Class Feedback
CREATE TABLE class_feedback (
    id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL REFERENCES users(user_uuid),
    attendance_id INTEGER NOT NULL REFERENCES attendance(id),
    class_instance_id INTEGER NOT NULL REFERENCES class_instances(id),
    rating feedback_rating,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attendance_id)
);

CREATE INDEX idx_feedback_user ON class_feedback(user_uuid);
CREATE INDEX idx_feedback_class ON class_feedback(class_instance_id);

-- Kiosk Auth
CREATE TABLE kiosk_auth (
    id SERIAL PRIMARY KEY,
    pin_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.3 Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_feedback ENABLE ROW LEVEL SECURITY;
-- ... enable for all tables

-- Create policies
-- Users can read their own data
CREATE POLICY "Users read own" ON users
    FOR SELECT USING (auth.uid() = user_uuid);

-- Teachers can read all users
CREATE POLICY "Teachers read all" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_uuid = users.user_uuid 
            AND ur.is_current = true 
            AND r.name = 'Teacher'
        )
    );

-- Admins have full access
CREATE POLICY "Admins full access" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_uuid = users.user_uuid 
            AND ur.is_current = true 
            AND r.name = 'Admin'
        )
    );
```

#### 2.4 Supabase Storage
1. Create bucket: `profile-pics`
2. Add storage policies for authenticated users

---

### Phase 3: Deployment (Priority 3)

#### 3.1 Configure Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

#### 3.2 Deploy to Netlify
1. Connect GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Add environment variables in Netlify dashboard
4. Deploy

---

### Phase 4: Security & Testing (Priority 4)

#### 4.1 Authentication & Authorization

**Implement Supabase Auth:**
- Replace hardcoded admin credentials with Supabase Auth
- Create auth context provider in Next.js
- Implement role-based access control

**Required Security Measures:**
1. **Authentication:**
   - Use Supabase Auth for all user logins
   - Implement session management
   - Add password strength requirements

2. **Authorization:**
   - RLS policies on all tables
   - API route protection (middleware)
   - Role verification on sensitive endpoints

3. **API Security:**
   - Rate limiting on auth endpoints
   - Input validation with Zod
   - Output sanitization
   - CORS configuration

4. **Data Protection:**
   - HTTPS only (Netlify handles this)
   - Secure cookies for tokens
   - Environment variable protection

#### 4.2 Testing Checklist

**Functional Tests:**
- [ ] User creation and search
- [ ] Student check-in workflow
- [ ] Teacher attendance confirmation
- [ ] Role management
- [ ] Curriculum and lesson management
- [ ] Feedback submission
- [ ] Analytics displays correctly
- [ ] Database backup/restore

**Security Tests:**
- [ ] Unauthorized access blocked
- [ ] Role-based access enforced
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] Brute force protection on login
- [ ] Password requirements enforced

**Performance Tests:**
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] Large datasets handled efficiently

---

## Implementation Notes

### Key Differences from Streamlit Version

1. **State Management:** Use React Context or Zustand instead of Streamlit session state
2. **Routing:** Next.js App Router for all pages
3. **Styling:** Tailwind CSS instead of custom CSS
4. **Charts:** Chart.js or Recharts instead of Plotly
5. **Forms:** React Hook Form with Zod validation
6. **Authentication:** Supabase Auth instead of JWT custom implementation
7. **Database:** Direct Supabase client calls instead of REST API

### Migration Strategy

1. **Data Export:** Export current SQLite data to JSON
2. **Transform:** Convert data format for PostgreSQL
3. **Import:** Load data into Supabase
4. **Verify:** Check data integrity
5. **Switch:** Point new app to production Supabase

### Feature Parity Checklist

Ensure all current features are replicated:
- [ ] User search with photo
- [ ] Class check-in workflow
- [ ] Session timeout
- [ ] Theme switching
- [ ] Photo upload (camera + file)
- [ ] All 11 settings tabs
- [ ] Analytics charts
- [ ] CSV export
- [ ] Database management

---

## Dependencies (Next.js/Supabase Version)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "next": "14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.300.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.x",
    "eslint-config-next": "14.x"
  }
}
```

---

## Conclusion

This specification provides a comprehensive blueprint for rebuilding the CKB Tracker application using Next.js and Supabase. The new architecture will offer:

1. **Better Performance:** Server-side rendering with Next.js
2. **Improved Security:** Supabase Auth and RLS
3. **Easier Maintenance:** TypeScript and modern React patterns
4. **Better UX:** Responsive design with Tailwind CSS
5. **Scalability:** Cloud-based PostgreSQL and storage

Follow the priority order:
1. Build complete frontend with local test database
2. Set up Supabase database with full schema
3. Deploy to Netlify
4. Implement proper security and testing

The result will be a fully functional martial arts attendance tracking system with feature parity to the original Streamlit application, but with modern, secure, and scalable architecture.

---

## KNOWN ISSUES

### Backend Server Requires Restart for New Auth Endpoints (March 21, 2026)

**Description:** After code updates, the backend server must be restarted for new auth endpoints to be available.

**Resolution:**
```bash
# Stop backend (Ctrl+C) and restart:
cd backend
uv run uvicorn app.main:app --reload
```

### User Search Endpoint (RESOLVED)

The `/users/search` endpoint now:
- Does NOT require authentication (public for kiosk/check-in)
- Uses query parameter `query` (not `q`)
- Returns user data for check-in flow

---

**Last Updated:** March 21, 2026
