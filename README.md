# CoEdit Pro

A real-time collaborative code editor built with modern web technologies. CoEdit Pro enables multiple users to simultaneously edit code with live synchronization, powered by CRDT (Conflict-free Replicated Data Type) technology.

---

## 🚀 Features

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously with live cursor presence
- **Active User Presence**: Connected users are shown in the active users panel using Yjs awareness state
- **Monaco Editor Integration**: Full-featured code editor (same as VS Code) with syntax highlighting
- **CRDT-based Sync**: Powered by Yjs for conflict-free real-time synchronization
- **WebSocket Communication**: Efficient bidirectional communication via Socket.io
- **Modern UI**: Clean interface with TailwindCSS styling
- **Dark Theme**: Developer-friendly dark theme

---

## 🏗️ Project Structure

```
CoEdit-Pro/
├── backend/                 # Express + Socket.io server
│   ├── package.json
│   └── server.js           # Main server entry point
│
└── frontend/               # React + Vite client
    ├── src/
    │   └── app/
    │       ├── App.jsx    # Main React component
    │       └── App.css    # Component styles
    ├── index.html
    ├── vite.config.js     # Vite configuration
    ├── package.json
    └── README.md
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Vite 7 | Build tool & dev server |
| TailwindCSS 4 | Styling |
| Monaco Editor | Code editor component |
| Yjs | CRDT for real-time sync |
| y-monaco | Monaco binding for Yjs |
| y-socket.io | WebSocket provider for Yjs |

### Backend
| Technology | Purpose |
|------------|---------|
| Express 5 | Web framework |
| Socket.io | WebSocket server |
| y-socket.io | Yjs server adapter |
| Node.js | Runtime |

---

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

---

## ⚡ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/NirmalSingh100754/CoEdit-Pro.git
cd CoEdit-Pro
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ▶️ Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000`

### Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (default Vite port)

### Build for Production

```bash
cd frontend
npm run build
```

---

## 🔧 Configuration

### Backend (server.js)

- **Port**: 3000
- **CORS**: Enabled for all origins (`*`)
- **Endpoints**:
  - `GET /` - Health check returning JSON message
  - `GET /health` - Server health status

### Frontend (vite.config.js)

- **Plugins**: React, TailwindCSS
- **Dev Server**: Runs on port 5173 by default

### Editor Connection

The frontend connects to the WebSocket server at:
```
http://localhost:3000
```

With room name: `monaco-demo-room`

---

## 📱 Current UI Layout

The application features a split-view layout:
- **Left Sidebar** (25% width): Amber/light colored panel showing active connected users
- **Main Editor** (75% width): Monaco code editor with dark theme

---

## 🔄 How It Works

1. **Client Connection**: When a user opens the app, it connects to the WebSocket server via `y-socket.io`
2. **Document Sync**: A shared Yjs document (`monaco`) is created and synchronized across all connected clients
3. **Active Presence**: `y-socket.io` awareness state tracks connected users and updates the active users list in real time
4. **Real-time Editing**: Changes in the Monaco editor are captured by `y-monaco` binding and propagated to all clients
5. **Conflict Resolution**: Yjs CRDT ensures eventual consistency without conflicts

## 📝 Today's Updates (May 9, 2026)

- **Multistage Docker Build Added**: Updated root `Dockerfile` to build frontend first and then bundle `dist` output into backend `public`.
- **Single Image Deployment Flow**: Standardized setup so one image serves both backend API and frontend static assets.
- **Build Context Cleanup**: Added `.dockerignore` entries for `.env` and `node_modules` to reduce context size and avoid shipping local files.

---

## 🐳 Docker Setup

The project uses a **single multistage Dockerfile** in the repository root:
1. Build frontend (`frontend/dist`)
2. Copy built frontend into backend static folder (`backend/public`)
3. Run backend server, which serves API and frontend together

### Build and Run Container

```bash
# Run this from project root (CoEdit-Pro)
docker build -t coedit-pro .
docker run -p3000:3000 coedit-pro
```

App will be available at `http://localhost:3000`.

---

## 📝 Previous Updates

## 📦 Dependencies

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
- `tailwindcss` - ^4.2.4
- `vite` - ^7.1.7 (dev)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

ISC License

---

## 👤 Author

Nirmal Singh

---

## 🔗 GitHub Repository

[CoEdit-Pro](https://github.com/NirmalSingh100754/CoEdit-Pro)