# TaskFlow — Team Task Manager

A full-stack project and task management application with role-based access control, built with Node.js, Express, SQLite, and React.

---

## Features

### Authentication
- JWT-based signup/login with bcrypt password hashing
- Protected routes on both frontend and backend
- Auto-assign admin role to first registered user
- Profile management (name, avatar color, password change)

### Projects
- Create, edit, archive, delete projects
- Track progress with completion percentage
- Due dates with overdue indicators
- Project-level admin and member roles

### Task Management
- Kanban board (To Do / In Progress / Review / Done)
- List view with sortable columns
- Priority levels: Low, Medium, High, Urgent
- Assign tasks to project members
- Due dates with overdue highlighting
- Task comments with delete support

### Dashboard
- Personal task stats (my tasks, overdue, upcoming)
- Status breakdown chart
- Priority bar chart
- Recent activity feed
- Upcoming deadlines

### Role-Based Access Control
| Feature | Admin | Project Admin | Member |
|---------|-------|---------------|--------|
| Create projects | ✓ | ✓ | ✓ |
| Delete any project | ✓ | own only | ✗ |
| Add/remove members | ✓ | ✓ | ✗ |
| Create tasks | ✓ | ✓ | ✓ |
| Update any task | ✓ | ✓ | assigned only |
| Delete tasks | ✓ | ✓ | created by only |
| Manage users | ✓ | ✗ | ✗ |

---

## Tech Stack

**Backend**
- Node.js + Express
- SQLite (via better-sqlite3) — single-file, zero-config DB
- JWT authentication
- bcryptjs password hashing

**Frontend**
- React 18 + React Router v6
- Vite build tool
- react-hot-toast notifications
- Custom CSS (no UI library — hand-crafted design)

---

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager

# Install all dependencies
npm run install:all

# Set up backend env
cp backend/.env.example backend/.env
# Edit backend/.env with your JWT_SECRET
```

### Run (two terminals)

```bash
# Terminal 1 — Backend API (port 5000)
npm run dev:backend

# Terminal 2 — Frontend dev server (port 5173)
npm run dev:frontend
```

Open http://localhost:5173

**Demo credentials:**
- Admin: `admin@taskflow.dev` / `admin123`
- (Register more accounts to test member access)

---

## Deployment on Railway

### Steps

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repository
4. Set environment variables in Railway dashboard:

```
JWT_SECRET=your_strong_random_secret_here
NODE_ENV=production
PORT=5000
```

5. Railway automatically:
   - Installs dependencies
   - Builds the React frontend (`npm run build`)
   - Starts the Express server which serves both API + static frontend
   - The `railway.toml` file configures the build and start commands

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | dev fallback | Secret for JWT signing |
| `PORT` | No | 5000 | Server port |
| `NODE_ENV` | No | development | Set to `production` on Railway |
| `DB_PATH` | No | `./data/taskmanager.db` | SQLite database file path |
| `FRONTEND_URL` | No | `*` | CORS origin (optional) |

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✓ | Get current user |
| PATCH | `/api/auth/profile` | ✓ | Update profile |
| PATCH | `/api/auth/password` | ✓ | Change password |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | ✓ | List my projects |
| POST | `/api/projects` | ✓ | Create project |
| GET | `/api/projects/:id` | ✓ member | Get project details |
| PATCH | `/api/projects/:id` | ✓ admin | Update project |
| DELETE | `/api/projects/:id` | ✓ admin | Delete project |
| GET | `/api/projects/:id/members` | ✓ member | List members |
| POST | `/api/projects/:id/members` | ✓ admin | Add member |
| PATCH | `/api/projects/:id/members/:uid` | ✓ admin | Change role |
| DELETE | `/api/projects/:id/members/:uid` | ✓ admin | Remove member |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tasks/my` | ✓ | My assigned tasks |
| GET | `/api/tasks/dashboard` | ✓ | Dashboard stats |
| GET | `/api/tasks/project/:id` | ✓ member | Project's tasks |
| POST | `/api/tasks/project/:id` | ✓ member | Create task |
| GET | `/api/tasks/:id` | ✓ member | Task details + comments |
| PATCH | `/api/tasks/:id` | ✓ member | Update task |
| DELETE | `/api/tasks/:id` | ✓ member | Delete task |
| POST | `/api/tasks/:id/comments` | ✓ member | Add comment |
| DELETE | `/api/tasks/:id/comments/:cid` | ✓ member | Delete comment |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | ✓ | Search users |
| GET | `/api/users/stats` | ✓ admin | Platform stats |
| PATCH | `/api/users/:id/role` | ✓ admin | Change user role |
| DELETE | `/api/users/:id` | ✓ admin | Delete user |

---

## Database Schema

```
users          → id, name, email, password, role, avatar_color, created_at
projects       → id, name, description, status, owner_id, due_date, created_at
project_members → project_id, user_id, role, joined_at
tasks          → id, title, description, status, priority, project_id, assigned_to, created_by, due_date, ...
comments       → id, task_id, user_id, content, created_at
activity_log   → id, user_id, action, entity_type, entity_id, entity_name, project_id, created_at
```

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── db/
│   │   └── database.js          # SQLite setup + schema init
│   ├── middleware/
│   │   └── auth.js              # JWT + RBAC middleware
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── projects.js          # Project CRUD + members
│   │   ├── tasks.js             # Task CRUD + comments
│   │   └── users.js             # User management
│   ├── server.js                # Express app entry
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js        # API request wrapper
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx  # Kanban board
│   │   │   ├── MyTasks.jsx
│   │   │   ├── TaskDetail.jsx
│   │   │   ├── Team.jsx
│   │   │   └── Profile.jsx
│   │   ├── components/
│   │   │   └── Layout.jsx       # Sidebar + layout shell
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── railway.toml
├── package.json                 # Root — build scripts
└── README.md
```

---

## Demo Video Talking Points

1. Show the login page and demo credentials
2. Walk through the dashboard (stats, activity feed, upcoming deadlines)
3. Create a new project, add a team member
4. Create tasks with different priorities, assign to team members
5. Demo the Kanban board — quick status changes
6. Open a task, add a comment
7. Switch to member account — show restricted access (can't delete others' tasks)
8. Show team management (admin role — change user roles)
9. Profile settings — change name and avatar color

---

## Author

Built as a full-stack assignment project demonstrating:
- RESTful API design
- JWT authentication + role-based access
- Relational database design with SQLite
- React frontend with client-side routing
- Production deployment on Railway
