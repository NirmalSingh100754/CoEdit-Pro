# CoEdit Pro

A real-time collaborative code editor built with React, Monaco, Yjs, Socket.io, and Express. It supports shared editing, active user presence, language selection, and server-side execution for Java, Python, and C++.

---

## Features

- **Real-time collaboration**: Multiple users edit the same shared Monaco document.
- **Active user presence**: Connected usernames appear through Yjs awareness state.
- **Username join flow**: Users enter a name before joining; the name is also reflected in the URL path.
- **Language selection**: Java, Python, and C++ templates are available from the editor toolbar.
- **Synced language changes**: Language changes are broadcast to other connected users through Socket.io.
- **Code execution**: The backend runs submitted code through `/api/execute` and returns stdout/stderr.
- **Output panel**: Run results appear below the editor.
- **Single-image Docker flow**: The root Dockerfile builds the frontend and serves it from the backend.

---

## Project Structure

```text
CoEdit-Pro/
├── Dockerfile                 # Multistage frontend + backend image
├── .dockerignore              # Excludes .env and node_modules
├── package.json               # Root dependency currently used for socket.io-client
├── backend/
│   ├── package.json
│   ├── public/                # Built frontend assets served by Express
│   └── server.js              # Express, Socket.io, Yjs, and code execution API
└── frontend/
    ├── src/
    │   └── app/
    │       ├── App.jsx        # Main collaborative editor UI
    │       └── App.css        # Tailwind import
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| Vite 7 | Build tool and dev server |
| TailwindCSS 4 | Styling |
| Monaco Editor | Code editor |
| Yjs | CRDT document sync |
| y-monaco | Monaco binding for Yjs |
| y-socket.io | Yjs Socket.io provider |
| socket.io-client | Client socket connection |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express 5 | API and static frontend server |
| Socket.io | WebSocket server |
| y-socket.io | Yjs Socket.io adapter |
| child_process | Runs compiler/interpreter commands |
| Python 3, g++, OpenJDK 17 | Code execution tools in Docker |

---

## Prerequisites

- Node.js 18 or higher
- npm
- Docker, if using the container flow
- Python 3, g++, and JDK locally if you want `/api/execute` to work outside Docker

---

## Installation

```bash
git clone https://github.com/NirmalSingh100754/CoEdit-Pro.git
cd CoEdit-Pro
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

---

## Running the Application

### Docker

```bash
docker build -t coedit-pro .
docker run -p 3000:3000 coedit-pro
```

Open `http://localhost:3000`.

### Local Backend

```bash
cd backend
npm run dev
```

The backend runs on `http://localhost:3000` and serves files from `backend/public`.

### Local Frontend Development

```bash
cd frontend
npm run dev
```

Vite runs on `http://localhost:5173`. The current frontend uses same-origin paths for Socket.io and `/api/execute`, so the full app works best when the built frontend is served by the backend or when a dev proxy is added.

### Production Build

```bash
cd frontend
npm run build
```

The Dockerfile automatically copies `frontend/dist` into `backend/public` during image build.

---

## Backend API

- `GET /health` - returns `{ message: "ok", success: true }`
- `POST /api/execute` - runs code for `java`, `python`, or `cpp`

Example request body:

```json
{
  "language": "python",
  "code": "print('Hello from Python')"
}
```

The backend creates a temporary directory for each run, writes the submitted file, executes it, returns stdout/stderr, and removes the temporary files. Execution times out after 10 seconds.

---

## App Flow

1. A user enters a username and joins the editor.
2. The client connects to Socket.io/Yjs on the same origin using room `monaco-demo-room`.
3. Monaco binds to the shared Yjs text document named `monaco`.
4. Yjs awareness updates the active users list.
5. Language changes are broadcast to connected clients.
6. The Run button sends the editor content to `/api/execute`.
7. Output appears in the bottom output panel.

---

## UI Layout

- **Join screen**: Username input and Join button.
- **Left sidebar**: Active users list.
- **Editor toolbar**: Language selector and Run button.
- **Main editor**: Monaco editor with dark theme.
- **Output panel**: Shows program output, errors, or timeout messages.

---

## Recent Updates

- Added username-based join flow.
- Added Java, Python, and C++ templates.
- Added language synchronization across connected clients.
- Added backend code execution through `/api/execute`.
- Added output panel below the editor.
- Added multistage Docker setup with Python 3, g++, and OpenJDK 17 in the backend image.
- Added `.dockerignore` entries for `.env` and `node_modules`.

---

## Dependencies

### Backend

- `express` - ^5.2.1
- `socket.io` - ^4.8.3
- `y-socket.io` - ^1.1.3
- `nodemon` - ^3.1.14 (dev)

### Frontend

- `react` - ^19.1.1
- `react-dom` - ^19.1.1
- `@monaco-editor/react` - ^4.7.0
- `yjs` - ^13.6.30
- `y-monaco` - ^0.1.6
- `y-socket.io` - ^1.1.3
- `socket.io-client` - ^4.8.3
- `tailwindcss` - ^4.2.4
- `vite` - ^7.1.7 (dev)

---

## License

ISC License

---

## Author

Nirmal Singh

---

## GitHub Repository

[CoEdit-Pro](https://github.com/NirmalSingh100754/CoEdit-Pro)

---

## AWS Note: ECS vs EC2

**Amazon EC2** gives you virtual servers. You choose the instance type, install software, manage the operating system, deploy your app, scale instances, and handle server maintenance.

**Amazon ECS** is a container orchestration service. You package the app as a Docker image, define how the container should run, and ECS starts, stops, scales, and monitors those containers. ECS can run on EC2 instances that you manage or on AWS Fargate where AWS manages the servers for you.

For this project, EC2 would mean running Node.js or Docker directly on a server. ECS would mean pushing the Docker image to a registry and letting AWS run the containerized app in a managed service.
