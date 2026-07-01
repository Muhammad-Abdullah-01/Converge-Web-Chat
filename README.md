# Converge | Full-Stack Real-Time Chat Application

Converge is a production-ready, full-stack real-time chat application built using the MERN stack, Socket.io, and Tailwind CSS. It supports user authentication, direct messaging, group chat rooms, typing indicators, delivery statuses, message reports, and a dedicated admin moderation panel.

---

## ⚡ Tech Stack

### Frontend
- **Framework:** React (Vite, JS/JSX)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS v4 (using Vite CSS Plugin)
- **HTTP Client:** Axios (with automatic token renewal interceptors)
- **Forms:** React Hook Form
- **Validation:** Zod (schema-based form validations)
- **State Management:** React Context API (Auth, Sockets)
- **Data Fetching:** TanStack Query v5 (React Query)

### Backend
- **Platform:** Node.js
- **Framework:** Express.js
- **WebSockets:** Socket.io
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Authentication:** JWT Access & Refresh Tokens (HTTP-Only Cookie storage)
- **Hashing:** bcrypt (10 salt rounds)
- **Request Validation:** Express Validator

---

## ⚙️ Features

### User & Auth
- User registration, login, logout, and token refresh.
- Forgot & reset password recovery via token email links (SMTP/Mailtrap).
- Password change and automatic avatar randomization from profile panel.
- Role-based permissions: `user` and `admin`.

### Real-Time Chat
- Direct (1-to-1) private chats (automatic room mapping).
- Multi-user Group Rooms with name & description.
- Real-time messages (Socket.io) with instant delivery.
- Online/offline contact status indicators.
- User typing status indicators.
- Triple check-receipt system: Sent (1 check), Delivered (2 checks), Read (2 blue checks).

### Admin Moderation Panel
- Overall stats dashboard (total users, rooms, message counts, active reports, online user count).
- User Management: promote/demote administrators, delete user accounts.
- Room Moderation: view and delete group or private chat channels.
- Message Moderation: view, dismiss, or delete reported messages.

---

## 📂 Project Structure

```
chat-app/
├── client/                     # Frontend Vite + React Project
│   ├── src/
│   │   ├── assets/             # Images, SVGs
│   │   ├── components/         # Reusable widgets (Sidebar, ChatArea, Modals)
│   │   ├── context/            # Auth and Socket state contexts
│   │   ├── layouts/            # Auth and Dashboard page layouts
│   │   ├── pages/              # Routing page views
│   │   ├── routes/             # Authentication/Admin routing guards
│   │   ├── services/           # Axios client configurations
│   │   ├── validations/        # Zod validation schemas
│   │   ├── App.jsx             # React router configuration
│   │   └── main.jsx            # React root renderer
│   └── package.json
│
├── server/                     # Backend Node.js Server Project
│   ├── config/                 # MongoDB Mongoose configurations
│   ├── controllers/            # Controller layers for endpoints
│   ├── middleware/             # Route blockers, roles and error handlers
│   ├── models/                 # Database Mongoose Schemas (User, Room, Message, Report)
│   ├── routes/                 # Express API Endpoint routes
│   ├── services/               # Token generation, Email dispatches
│   ├── sockets/                # Socket.io JWT authentication & connection events
│   ├── validators/             # Express Request validator rules
│   └── package.json
```

---

## 🔧 Environment Setup

### Backend (.env)
Create a `.env` file in the `/server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_ACCESS_SECRET=your_jwt_access_secret_key_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_32_chars
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_app_password
EMAIL_FROM=no-reply@converge.com
NODE_ENV=development
```

### Frontend (.env)
Create a `.env` file in the `/client` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Running Locally

1. **Install Dependencies:**
   ```bash
   # Install client packages
   cd client
   npm install --legacy-peer-deps

   # Install server packages
   cd ../server
   npm install
   ```

2. **Start Server:**
   ```bash
   cd server
   npm run dev
   ```

3. **Start Client:**
   ```bash
   cd client
   npm run dev
   ```

---

## 📁 Deployment

### Frontend (Vercel)
The Vite React client is ready for Vercel. Ensure your `vite.config.js` is built and deploy using Vercel CLI or project import:
- Output directory: `dist`
- Install command: `npm install --legacy-peer-deps`
- Build command: `npm run build`

### Backend (Render)
Ensure your environment variables are added to the Render web service dashboard.
- Build command: `npm install`
- Start command: `node server.js`
