# TaskFlow: Project Management Tool

TaskFlow is a full-stack project management application built for the **CodeAlpha Full Stack Development internship**. Authenticated users can create projects, invite teammates by email, manage tasks on a To Do / In Progress / Done board, assign work, track progress, and see task activity.

The frontend is plain HTML, CSS and JavaScript served directly by a Node.js / Express API backed by MongoDB, so the whole app runs as a single Node.js process.

> **Implementation note:** this README documents only what is wired into the running application. The repository also contains unfinished, unused security and email-verification code; it is listed under [Known Limitations](#known-limitations) and is not presented as a feature.

## Table of Contents

- [Project Description](#project-description)
- [Implemented Features](#implemented-features)
- [Roles and Authorization](#roles-and-authorization)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Authentication and Security](#authentication-and-security)
- [Database](#database)
- [Testing](#testing)
- [Screenshots / Demo](#screenshots--demo)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## Project Description

TaskFlow is meant for individuals and small teams (for example students on a shared project) who want one simple place to organise project work: who is on a project, what needs doing, who is doing it, and what has changed.

It is a learning/portfolio project, not a production-hardened product.

## Implemented Features

### Accounts

- Registration with name, email and password.
- Password rules enforced at registration: at least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.
- Passwords hashed with `bcryptjs`.
- Login returns a JWT valid for 7 days; the browser sends it as a Bearer token.
- Profile settings: change your name, upload or remove a profile picture (PNG, JPEG or WebP; the browser converts it to a square JPEG before upload).

### Projects and teams

- Create projects with a name and optional description.
- See every project you own or belong to.
- Owners can invite people by email, view and revoke pending invitations, remove members, and delete the project.
- Members can leave a project. The owner cannot be removed.
- Deleting a project also deletes its tasks and invitations; removing a member unassigns them from that project's tasks.

### Invitations

- Invitations are stored against the invited email address, so someone who has not registered yet sees theirs after signing up with that email.
- Duplicate pending invitations, and inviting someone already on the project, are rejected.
- Invited users accept or decline from **Projects → Invitations**.
- **No invitation email is sent**; invitations appear inside the app.

### Tasks

- Create tasks in projects you own or belong to.
- Priority (low / medium / high), due date, status (To Do / In Progress / Done) and description (a small Markdown-style renderer in the frontend).
- Assign a task to the project owner or a member, or leave it unassigned.
- Subtasks (add, complete, remove) with progress.
- Comments, plus an activity history that records assignment, status, priority and rename changes.
- Tasks page: board view with filters by project and by "Assigned to me" / "Unassigned"; task details open in a drawer.

### Dashboard and interface

- Stat cards (projects, tasks, in progress, done), overall completion percentage, and an overdue count on the in-progress card.
- Recent activity timeline (projects created, tasks added or completed, comments).
- Recent tasks as a list or board, with a priority filter.
- Quick-add task dialog, and an optional sample project with three demo tasks when you have no tasks.
- Command-palette-style search across your projects and tasks.
- Keyboard shortcuts: `Ctrl/Cmd + K` (search), `N` (new task), `?` (shortcut list), arrow keys + `Enter`, `Esc`.
- Workspace preference for the default priority of new tasks (stored in the browser).
- Public landing page, register and login pages, Terms and Privacy page, loading and empty states, toast notifications, and a responsive layout.

## Roles and Authorization

There is no global admin role. The `User` model has a `role` field (default `"member"`), but the API does not use it for any authorization decision. Permissions come from a user's relationship to a project:

| Access level | Implemented permissions |
|---|---|
| **Project owner** | Everything a member can do, plus invite/revoke invitations, remove members, delete the project. |
| **Project member** | View the project; create, update and delete its tasks; comment; be assigned tasks; leave the project. |
| **Unauthenticated visitor** | Public pages, register/login, and avatar images. |

Task access is checked by confirming the signed-in user owns or belongs to the task's project.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript, Fetch API, `localStorage` (token and user), native `<dialog>` elements. No framework or build step. |
| Backend | Node.js, Express 5 (`^5.1.0`), CommonJS modules |
| Database | MongoDB with Mongoose 8 (`^8.18.0`) |
| Authentication | `jsonwebtoken` (`^9.0.2`), `bcryptjs` (`^3.0.2`) |
| Other runtime packages | `express-rate-limit`, `cors`, `dotenv` |

Versions are the ranges declared in `server/package.json`. Dependencies are installed with `npm install`; `node_modules` is not needed in the source.

## System Architecture

```
Browser
  │  HTTP / JSON
  ▼
Express server (server/server.js)
  ├── serves static files from /client
  ├── /api/auth
  ├── /api/projects
  ├── /api/tasks
  ├── /api/invites
  └── /api/health
        │  Mongoose
        ▼
     MongoDB
```

**Request flow**

1. The browser loads the HTML/CSS/JS from the Express server.
2. Frontend scripts call `/api/...` with `fetch`, sending `Authorization: Bearer <token>`.
3. `authMiddleware` verifies the JWT and sets `req.user.id`.
4. Route handlers read and write MongoDB through Mongoose models.
5. Errors come back as JSON in the form `{ "message": "..." }`.

## Project Structure

```
.
├── README.md
├── .gitignore
├── client/
│   ├── index.html            # Landing page
│   ├── register.html
│   ├── login.html
│   ├── dashboard.html
│   ├── projects.html         # Projects, team, invitations
│   ├── tasks.html            # Task board
│   ├── terms.html
│   ├── css/
│   │   ├── style.css
│   │   └── dashboard.css
│   └── js/
│       ├── app.js            # Shared helpers, nav, task drawer, search, shortcuts
│       ├── auth.js
│       ├── dashboard.js
│       ├── projects.js
│       └── tasks.js
└── server/
    ├── server.js             # Express entry point
    ├── package.json
    ├── .env.example
    ├── config/db.js          # MongoDB connection
    ├── middleware/
    │   ├── authMiddleware.js # JWT verification
    │   └── rateLimiter.js    # Active rate limiters
    ├── models/               # User, Project, Task, Invitation
    └── routes/               # authRoutes, projectRoutes, taskRoutes, inviteRoutes
```

Not shown above because they are **not used by the running app** (see [Known Limitations](#known-limitations)): `server/config/env.js`, `server/middleware/{errorHandler,security,validate}.js`, `server/validators/schemas.js`, `server/utils/*`, `server/scripts/verify-existing-users.js`, `client/verify-email.html`, `client/js/verify-email.js`, `client/js/verify-banner.snippet.js`.

## Getting Started

### Prerequisites

- Node.js 18 or newer (Express 5 requires a modern Node release) and npm
- A MongoDB database: a local instance or a MongoDB Atlas connection string

No separate frontend server is needed.

### Installation

```bash
git clone https://github.com/devchala/CodeAlpha_ProjectManagementTool.git
cd CodeAlpha_ProjectManagementTool/server
npm install
```

Create `server/.env` from the example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set at least `MONGO_URI` and `JWT_SECRET` (see below). Never commit `.env`; it is listed in `.gitignore`.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No | HTTP port. Defaults to `5000`. |
| `MONGO_URI` | **Yes** | MongoDB connection string. |
| `JWT_SECRET` | **Yes** | Secret used to sign and verify JWTs. Use a long random value. |
| `RATE_LIMIT_ENABLED` | No | Set to `false` to switch rate limiting off (e.g. in development). |
| `RATE_LIMIT_<NAME>_MAX` | No | Override a limiter's request count. |
| `RATE_LIMIT_<NAME>_WINDOW_MIN` | No | Override a limiter's window, in minutes. |

`<NAME>` is one of `API`, `LOGIN`, `REGISTER`, `INVITE`, `PROFILE`. Defaults are in the [rate limiting table](#rate-limiting).

Safe `.env` example (placeholders only):

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret

# Optional rate-limit overrides
# RATE_LIMIT_ENABLED=true
# RATE_LIMIT_LOGIN_MAX=10
# RATE_LIMIT_LOGIN_WINDOW_MIN=15
```

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Running the Application

Scripts defined in `server/package.json` (run from `server/`):

| Command | Runs | Purpose |
|---|---|---|
| `npm run dev` | `node --watch server.js` | Development, restarts on file changes |
| `npm start` | `node server.js` | Normal start |

Then open `http://localhost:5000` (or your `PORT`).

Health check: `GET /api/health` returns `{ "status": "ok", "message": "TaskFlow API is running" }`.

There is no test script.

## API Documentation

All routes are prefixed with `/api`. Protected routes need the header `Authorization: Bearer <JWT>`. All `projects`, `tasks` and `invites` routes are protected.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account; returns a token and user. |
| POST | `/api/auth/login` | No | Log in; returns a token and user. |
| GET | `/api/auth/me` | Yes | Current user. |
| PUT | `/api/auth/me` | Yes | Update name and/or avatar (PNG/JPEG/WebP data URL, about 100 KB max). |
| GET | `/api/auth/avatar/:id` | No | A user's stored avatar image. |

### Projects

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | Yes | Projects you own or belong to. |
| POST | `/api/projects` | Yes | Create a project. |
| GET | `/api/projects/:id/invites` | Owner | Pending invitations for the project. |
| POST | `/api/projects/:id/invites` | Owner | Invite someone by email. |
| DELETE | `/api/projects/:id/invites/:inviteId` | Owner | Revoke a pending invitation. |
| DELETE | `/api/projects/:id/members/:userId` | Yes | Leave (yourself) or remove a member (owner). |
| DELETE | `/api/projects/:id` | Owner | Delete the project, its tasks and invitations. |

### Invitations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/invites` | Yes | Pending invitations addressed to your email. |
| POST | `/api/invites/:id/accept` | Yes | Accept an invitation. |
| POST | `/api/invites/:id/decline` | Yes | Decline an invitation. |

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | Yes | Tasks in your projects (optional `?project=<id>`). |
| GET | `/api/tasks/:id` | Yes | One task with project and member details. |
| POST | `/api/tasks` | Yes | Create a task. |
| PUT | `/api/tasks/:id` | Yes | Update title, status, priority, due date, description, subtasks or assignee. |
| DELETE | `/api/tasks/:id` | Yes | Delete a task. |
| POST | `/api/tasks/:id/comments` | Yes | Add a comment. |

### Utility

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Basic health response. |

Unknown `/api` routes return `404` with `{ "message": "Not found" }`.

### Examples

Create a project:

```http
POST /api/projects
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Tasks for the new website."
}
```

Create a task:

```http
POST /api/tasks
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "title": "Build the landing page",
  "project": "<project-id>",
  "priority": "high",
  "dueDate": "2026-12-01",
  "assignedTo": "<user-id>"
}
```

## Authentication and Security

Only mechanisms that are active in the running server are listed.

- **JWT authentication:** issued on register and login, expires after 7 days, verified by `authMiddleware` on protected routes. The browser keeps the token in `localStorage`; there are no refresh tokens or HTTP-only cookies.
- **Password hashing:** `bcryptjs` (cost factor 10) before the user is saved, plus the password-strength rule above.
- **Authorization checks:** owner-only actions, project-membership checks for tasks, and a check that assignees are project members.
- **Rate limiting:** see below.
- **Avatar validation:** data-URL format, size limit and file signature checks; avatars are served with `X-Content-Type-Options: nosniff`.
- **Request limits:** JSON bodies are limited to 200 KB; names, comments, descriptions and subtasks are trimmed or truncated on the server; the manual checks include email format on invitations and duplicate-invitation checks.
- **Output escaping:** the frontend HTML-escapes user-supplied text in most places it renders it.
- **Secrets:** `.env` is excluded from Git via `.gitignore`.

The project has had no security audit and should not be described as fully secure or production-ready. See the limitations below.

### Rate Limiting

Implemented with `express-rate-limit` using the default in-memory store. When a limit is exceeded the API returns **HTTP 429**, a `{ "message": ... }` body and standard rate-limit headers.

| Limiter | Default | Counted per |
|---|---|---|
| All `/api` requests | 600 per 15 minutes | IP address |
| Failed logins (successful ones not counted) | 10 per 15 minutes | IP address |
| Sign-ups | 10 per hour | IP address |
| Sending invitations | 20 per hour | User |
| Profile updates | 20 per hour | User |

Counters are local to the Node.js process: restarting the server resets them, and multiple instances would not share them.

## Database

MongoDB through Mongoose. The server connects with `MONGO_URI` (`server/config/db.js`).

| Model | Fields |
|---|---|
| **User** | `name`, `email` (unique, lowercase), `password` (hash), `role`, `avatar` (not returned by default), `avatarVer`, timestamps |
| **Project** | `name`, `description`, `owner` (User), `members` (Users), `status`, timestamps |
| **Task** | `title`, `description`, `project`, `assignedTo`, `status` (`todo`, `in-progress`, `done`), `priority` (`low`, `medium`, `high`), `dueDate`, `subtasks`, `comments`, `history`, timestamps |
| **Invitation** | `project`, `email`, `invitedBy`, `status` (`pending`, `accepted`, `declined`), timestamps. Indexed on `project + email + status`. |

## Testing

No automated tests are included and `package.json` has no test script. Verify changes by running the app and exercising the affected flows manually.

## Screenshots / Demo

No screenshots or demo media exist in the repository, so none are included.

## Known Limitations

1. **Email verification is not implemented.** The repo contains `client/verify-email.html`, `client/js/verify-email.js` and `client/js/verify-banner.snippet.js`, plus `server/utils/mail.js`, `server/utils/tokens.js` and `server/scripts/verify-existing-users.js`. But `authRoutes.js` has no `POST /api/auth/verify-email` or `POST /api/auth/resend-verification`, the `User` model has no `emailVerified` field, and registration never sends email. Treat these files as unfinished scaffolding.
2. **No invitation emails.** Invitations are stored in MongoDB and shown inside the app only.
3. **Unused security middleware.** `server/middleware/security.js` (Helmet, restricted CORS, its own limiters) is never imported. The server uses plain `cors()`, so any origin is allowed and no security-header middleware is active.
4. **Unused configuration and validation code.** `server/config/env.js` (stricter environment validation), `server/middleware/validate.js` and `server/validators/schemas.js` (Zod) are not used. Routes do their own manual validation, and route `:id` parameters are not format-checked before reaching the database.
5. **Unused error handler.** `server/middleware/errorHandler.js` is not imported; `server.js` uses an inline handler that can return raw error messages.
6. **Missing dependencies for the unused code.** `helmet`, `zod` and `nodemailer` are not in `package.json` (and not installed), so those files would fail if loaded. The running app does not need them.
7. **Migration script has no npm command.** `server/scripts/verify-existing-users.js` mentions `npm run verify-existing-users`, but no such script exists.
8. **Process-local rate limiting.** In-memory counters reset on restart and are not shared across instances.
9. **JWT in `localStorage`.** Readable by any script running on the page; there is no refresh-token or server-side logout mechanism.
10. **Avatars stored in MongoDB.** Profile pictures are base64 strings inside the user document (about 100 KB limit).
11. **No deployment, container or CI configuration** is included, so no deployment target is claimed.
12. **No automated tests.**

## Future Improvements

These are ideas, **not** current features:

- Finish and wire in email verification (routes, `emailVerified` field, mail sending), or remove the scaffolding.
- Use the existing Zod validation and Helmet middleware, add the missing dependencies, and replace `cors()` with an explicit allow-list.
- Centralise environment validation and error handling.
- Add automated unit and API tests with a `test` script.
- Use a shared rate-limit store if deployed across multiple instances.
- Review token storage and session handling before any production use.
- Add CI checks and deployment documentation once a real target is chosen.

## Contributing

This is primarily an internship project. If contributions are accepted:

1. Fork the repository and create a focused branch.
2. Keep changes small and verify the affected flows locally (there is no test suite).
3. Document any new behaviour that is actually implemented.
4. Open a pull request describing the change.

## License

No license file is included, so the repository does not currently declare a license.
