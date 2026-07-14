# CodeSync

A production-quality MVP for real-time collaborative code editing.

## Features (Planned)

- Authenticated users with JWT
- Real-time collaborative editing using Monaco Editor & Socket.IO
- Multiple languages support (cpp, python, java, javascript)
- Room Chat & Online Presence

## Project Structure

```
codesync/
├── client/   (React, Vite, Monaco, Tailwind)
├── server/   (Fastify, Socket.IO, Prisma, PostgreSQL)
└── shared/   (Shared Types, Zod Schemas, Socket Events)
```

## Backend Database Setup (PostgreSQL + Prisma)

### 1. PostgreSQL Setup

Ensure you have PostgreSQL running locally (or remotely). Create a database named `codesync` (or use any desired name).

### 2. Environment Variables

In the `server/` directory, create a `.env` file based on `.env.example`:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/codesync"
JWT_SECRET="super-secret-jwt-key"
```

_Note: Never commit your real `.env` file!_

### 3. Running Migrations & Generating Client

Whenever you update `server/prisma/schema.prisma`, run the following commands in the `server/` directory:

```bash
npx prisma generate
npx prisma migrate dev --name [migration-name]
```

### 4. Prisma Studio

To inspect the database graphically, run:

```bash
npx prisma studio
```

### 5. Starting the Backend

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3000`. You can check the health at `/api/health` and the Swagger documentation at `/docs`.
