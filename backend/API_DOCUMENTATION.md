# AfriLaunch Hub — API Documentation

**Base URL:** `/api/v1`

**Authentication:** Bearer JWT in header: `Authorization: Bearer <token>`

---

## Auth

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/auth/register` | Create account | Public |
| POST | `/auth/login` | Login | Public |
| GET | `/auth/me` | Get current user | JWT |
| POST | `/auth/logout` | Logout | JWT |

**Register body:** `{ "name", "email", "password", "role?" }` — role defaults to `client`.  
**Login body:** `{ "email", "password" }` — returns `{ user, token }`.

---

## Users

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/users` | List users (optional `?role=developer`) | Admin |
| GET | `/users/:id` | Get user | Self or Admin |
| PUT | `/users/:id` | Update user (e.g. name) | Self or Super Admin |

---

## Clients

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/clients` | Create client profile | Admin/PM |
| GET | `/clients` | List all clients | Admin |
| GET | `/clients/:id` | Get client | Self or Admin |
| PUT | `/clients/:id` | Update client | Self or Admin |

**Create body:** `{ "userId", "businessName", "industry?", "ideaSummary?", "budgetRange?" }`

---

## Projects

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/projects` | Create project | Admin/PM |
| GET | `/projects` | All projects (admin) or own (client) | JWT |
| GET | `/projects/:id` | Project details | JWT (role/ownership) |
| PUT | `/projects/:id` | Update project | Admin/PM |
| DELETE | `/projects/:id` | Delete project | Admin/PM |

**Create body:** `{ "clientId", "projectName", "description?", "stage?", "startDate?", "deadline?" }`

---

## Tasks

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/projects/:id/tasks` | Create task | Admin/PM |
| GET | `/projects/:id/tasks` | List tasks for project | JWT (role/ownership) |
| PUT | `/projects/:id/tasks/:taskId` | Update task | Admin/PM/Assigned/Client |
| DELETE | `/projects/:id/tasks/:taskId` | Delete task | Admin/PM |

**Create body:** `{ "title", "description?", "status?", "assignedToId?", "dueDate?" }`  
**Status:** `Todo` | `InProgress` | `Done` | `Blocked`

---

## Roles (for access control)

- `client` — own projects only  
- `developer`, `designer`, `marketer` — assigned work  
- `project_manager` — manage projects and tasks  
- `finance_admin` — payments/clients list  
- `super_admin` — full access  
- `investor` — view-only (to be enforced in future endpoints)
