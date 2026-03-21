# TaskFlow

A full-stack task management app built with Node.js, Express, MongoDB, and Vanilla JavaScript.

Users can register, log in, and manage their tasks with status tracking, priority levels, filtering, and pagination. Admins can view tasks across all users.

---

## Tech Stack

| | |
|---|---|
| Backend | Node.js, Express.js v5 |
| Database | MongoDB, Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Security | Helmet, CORS, express-rate-limit, bcryptjs |
| Frontend | HTML, CSS, Vanilla JavaScript |

---

## Project Structure

```
TaskFlow/
├── README.md
├── .gitignore
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── task.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── logger.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   └── task.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── task.routes.js
│   │   ├── utils/
│   │   │   ├── asyncHandler.js
│   │   │   └── generateToken.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
└── frontend/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── api.js
    │   ├── auth.js
    │   └── dashboard.js
    ├── index.html
    └── dashboard.html
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally, or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

### 1. Clone the repo

```bash
git clone https://github.com/NitinKushwahcodes/TaskFlow.git
cd TaskFlow
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in your `.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=         # see below
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the server:

```bash
npm run dev    # development
npm start      # production
```

### 3. Run the frontend

No build step needed. Open `frontend/index.html` with VS Code Live Server, or:

```bash
cd frontend
npx serve .
```

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Create a new account |
| POST | `/auth/login` | Public | Login and get token |
| GET | `/auth/me` | Private | Get current user's profile |

### Tasks

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/tasks` | Private | Create a task |
| GET | `/tasks` | Private | Get tasks (paginated) |
| GET | `/tasks/:id` | Private | Get a single task |
| PUT | `/tasks/:id` | Private | Update a task |
| DELETE | `/tasks/:id` | Private | Delete a task |

**Query params for `GET /tasks`**

| Param | Example | Description |
|-------|---------|-------------|
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=10` | Results per page (max: 50) |
| `status` | `?status=todo` | Filter: `todo`, `in-progress`, `done` |
| `priority` | `?priority=high` | Filter: `low`, `medium`, `high` |

---

## Request / Response Examples

**Register**
```json
POST /api/v1/auth/register
{
  "userName": "Nitin",
  "email": "nitin@example.com",
  "password": "secret123"
}
```

**Create task**
```json
POST /api/v1/tasks
Authorization: Bearer <token>

{
  "title": "Build the API",
  "description": "Set up Express and MongoDB",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-04-15"
}
```

**Success response shape**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": { ... }
}
```

**Error response shape**
```json
{
  "success": false,
  "message": "Task not found"
}
```

**Paginated list shape**
```json
{
  "success": true,
  "count": 8,
  "pagination": {
    "total": 34,
    "page": 1,
    "limit": 8,
    "pages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "tasks": [ ... ]
}
```

---

## HTTP Status Codes

| Code | When |
|------|------|
| 200 | Successful GET, PUT, DELETE |
| 201 | Resource created (register, new task) |
| 400 | Invalid ID format |
| 401 | Missing, expired, or invalid token |
| 403 | Token valid but not the resource owner |
| 404 | Resource not found |
| 409 | Email already registered |
| 422 | Validation failed |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

---

## Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT stored with configurable expiry
- Helmet sets HTTP security headers
- Rate limiting on auth routes (10 req / 15 min)
- CORS restricted to the configured frontend origin
- Request body capped at 10kb
- Only whitelisted fields accepted on task update
- Same error message for wrong email and wrong password (prevents user enumeration)
- All user content HTML-escaped on the frontend before DOM insertion

---

## Author

**Nitin Kushwaha**
GitHub: [@NitinKushwahcodes](https://github.com/NitinKushwahcodes)
