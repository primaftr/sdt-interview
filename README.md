<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  <strong>Birthday Notification Service</strong><br/>
  A scalable backend service built with NestJS, Prisma 7, and PostgreSQL
</p>

---

## 📌 Overview

This project is a **Birthday Notification Service** that sends a birthday email to users at  
**09:00 AM in their local timezone**, regardless of where they live.

It is designed with **production-grade patterns** and focuses on:

- correctness
- scalability
- fault tolerance
- clean architecture

---

## Running the App

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (only required for local runs)

### Run with Docker (recommended)

```bash
docker compose up --build
```

Application will be available at:

```text
http://localhost:3000
```

This will:

1. Start PostgreSQL
2. Run Prisma migrations
3. Start the NestJS app

### Run Locally (without Docker)

```bash
npm install
npx prisma migrate deploy
npm run start:dev
```

---

## Running Tests

### Unit & Integration Tests

```bash
npm run test
```

---

## Running E2E Tests

Ensure the database is running and migrations are applied.

### With Docker Running

```bash
npm run test:e2e
```

### Local Setup

```bash
npx prisma migrate deploy
npm run test:e2e
```

## ✨ Features

- ✅ Create, update, and delete users
- ✅ Email sent at **09:00 local time** per user
- ✅ IANA timezone support (`Asia/Jakarta`, `Australia/Melbourne`, etc.)
- ✅ Exactly-once email delivery (no duplicates)
- ✅ Exponential backoff for retries
- ✅ Database outbox pattern
- ✅ Distributed locking with PostgreSQL
- ✅ Batch processing + controlled parallelism
- ✅ Prisma 7 with driver adapters
- ✅ Swagger / OpenAPI enabled
- ✅ Docker & Docker Compose setup
- ✅ Migration job container

---

## 🧱 Tech Stack

- **Node.js 24**
- **NestJS**
- **Prisma 7**
- **PostgreSQL**
- **Docker & Docker Compose**
- **Luxon** (timezone handling)

---

## 🏗 High-Level Architecture

```
Client
  │
  ▼
NestJS API (Users)
  │
  ▼
Message Outbox (PostgreSQL)
  │
  ▼
Worker (Scheduler)
  │
  ▼
External Email Service
```

---

## 📡 API Endpoints

### Create user

```
POST /user
```

### Update user

```
PUT /user/:email
```

### Delete user

```
DELETE /user/:email
```

### Swagger (OpenAPI)

```
http://localhost:3000/api
```

---

## 🧪 Validation Rules

- Email must be valid and **unique**
- Birthday must be a **past date**
- Timezone must be a **valid IANA timezone**
- Unknown fields are rejected

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/sdt
```

---

## 🔁 Background Processing

Birthday emails are sent by a **worker** that:

- Processes messages in **bounded batches**
- Uses **distributed database locking**
- Applies **exponential backoff**
- Limits concurrent email sends

This allows the system to safely handle **hundreds of thousands to millions of messages**.
