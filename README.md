# TaskFlow

**A full-stack task management application built with FastAPI, React, PostgreSQL, and Docker.**

TaskFlow is a task management application designed as a practical DevOps portfolio project. It combines a REST API, a modern web interface, a relational database, and containerized deployment.

## Features

- User authentication and account management
- Personal task management with ownership isolation
- Create, view, update, and delete tasks
- Task completion tracking
- CSRF protection for cookie-based authentication
- Database migrations with Alembic
- PostgreSQL persistence
- Docker Compose deployment
- React and TypeScript frontend
- Automated backend tests

## Tech Stack

| Component | Technology |
|---|---|
| Backend | Python, FastAPI |
| Frontend | React, TypeScript, Vite |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Testing | pytest |
| Web server | Nginx |
| Containers | Docker, Docker Compose |

## Architecture

```text
Browser
   |
   v
Nginx (Frontend)
   |
   v
FastAPI (Backend)
   |
   v
PostgreSQL
```

Docker Compose manages the frontend, backend, and database services. Nginx serves the frontend and proxies API requests to FastAPI. PostgreSQL stores application data in a persistent Docker volume.

## Prerequisites

- Docker Engine
- Docker Compose plugin
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Configure environment variables

Create a local environment file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your own values:

```dotenv
DB_PASSWORD=your_strong_database_password
JWT_SECRET_KEY=your_long_random_secret
```

Use strong, unique secrets. Never commit `.env` or publish real credentials.

### 3. Start the application

```bash
sudo docker compose up --build -d
```

Check the service status:

```bash
sudo docker compose ps
```

View logs:

```bash
sudo docker compose logs -f
```

### 4. Open the application

Frontend: http://localhost:8080

The API is available internally through the Docker Compose network. The frontend's Nginx server proxies API requests to the backend.

## Development

### Backend

Create and activate a Python virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate.fish
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the development server:

```bash
python -m uvicorn app.main:app --reload
```

### Frontend

Install dependencies:

```bash
cd frontend
npm ci
```

Start the Vite development server:

```bash
npm run dev
```

Build the frontend for production:

```bash
npm run build
```

## Database Migrations

Database migrations are managed with Alembic.

Apply migrations:

```bash
alembic upgrade head
```

Check the current migration:

```bash
alembic current
```

When running through Docker Compose, the backend applies migrations during container startup.

## Testing

Run the backend test suite from the project root with the virtual environment activated:

```bash
pytest -q
```

## Security

The project includes security-oriented features such as authentication, password hashing, CSRF protection, and per-user task ownership.

Security best practices:

- Keep `.env` out of version control.
- Use strong, randomly generated secrets.
- Do not expose PostgreSQL publicly in production.
- Use HTTPS and secure cookie settings when deploying publicly.
- Keep dependencies and base images updated.
- Review authentication, authorization, and input validation before production deployment.

This project is intended for learning and portfolio purposes. A production deployment requires additional security review and operational hardening.

## Useful Commands

Stop the application:

```bash
sudo docker compose down
```

Rebuild and restart services:

```bash
sudo docker compose up --build -d
```

Inspect running containers:

```bash
sudo docker compose ps
```

Follow application logs:

```bash
sudo docker compose logs -f api frontend
```

**Note:** `docker compose down` preserves the named PostgreSQL volume. Avoid `docker compose down -v` unless you explicitly intend to delete persistent database data.

## Roadmap

- [ ] CI pipeline with GitHub Actions
- [ ] Automated linting and testing
- [ ] Container image scanning
- [ ] Automated deployment workflow
- [ ] Monitoring and observability
- [ ] Production deployment with HTTPS

## License

No license has been specified yet.
