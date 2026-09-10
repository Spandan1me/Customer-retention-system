# Customer Retention Management System (ISP SaaS)

A production-ready SaaS web application built for ISP Customer Retention Departments to reduce churn, prioritize callbacks, track team hierarchy performance, and convert customer retention promises into verified successful recharges.

---

## Key Features & Architecture

- **Multi-Tenant SaaS Architecture**: Database isolation per `Organization` with role-based security.
- **Hierarchical Role Control**:
  - **Super Admin**: Organization settings, user hierarchy, categories, disposition mappings, audit logs, customer import.
  - **Supervisor**: Manages Team Leads and Agents under assigned teams, identifies team activity gaps, exports reports.
  - **Team Lead**: Monitors agent call activity in real time, compares targets vs achievement, reassigns customers.
  - **Agent**: Smart Work Queue ("Next Best Customer to Call"), follow-up outcome logger, customer 360 profile view.
- **Disposition Intelligence**: 35 pre-configured ISP churn follow-up dispositions mapped to business classifications (`POSITIVE_INTENT`, `BARRIER`, `SERVICE_ISSUE`, `COMPETITOR_LOSS`, `SUCCESS`, `INVALID`, `UNREACHABLE`).
- **Recharge Conversion Module**: Actual verified recharge is the primary KPI. Features a 6-stage retention funnel: `Assigned -> Contacted -> Connected -> Positive Intent -> Ready to Recharge -> Actually Recharged`.
- **Export Engine**: 12 comprehensive reports exportable to CSV, Excel (`.xlsx`), and PDF (`.pdf`).
- **Seeded Dataset**: Comes populated with 65 staff users (1 Admin, 2 Supervisors, 2 Team Leads, 60 Agents) and 500+ realistic churned customer profiles with complete call histories and verified recharges.

---

## Seeded User Credentials (Password: `password123` / `admin123`)

| Role | Username | Password | Scope / Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Full org access, command center, import, export, audit trail |
| **Supervisor 1** | `supervisor1` | `password123` | Team Lead 1 & 30 Agents performance overview |
| **Team Lead 1** | `teamlead1` | `password123` | Real-time agent tracking table, coaching highlights |
| **Retention Agent 1** | `agent1` | `password123` | Smart Work Queue, personal targets, call logging |

*(Agents 1 through 60 are pre-configured: `agent1` to `agent60`)*

---

## Tech Stack

- **Backend**: Django 5, Django REST Framework, JWT Authentication (`simplejwt`), Celery, Redis, SQLite (Dev) / PostgreSQL 16 (Prod).
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Zustand state management.
- **Containerization**: Docker, Docker Compose, Nginx, Gunicorn.

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python seed_data.py
python manage.py runserver
```
Backend API will be live at `http://127.0.0.1:8000/api/v1/`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web Dashboard will be live at `http://localhost:3000`

---

## Quick Start (Docker Compose Production Setup)

```bash
docker-compose up --build
```
- Web Application: `http://localhost`
- Backend API: `http://localhost:8000/api/v1/`
