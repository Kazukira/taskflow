from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.tasks import router as tasks_router
from app.auth import router as auth_router

app = FastAPI(
    title="TaskFlow API",
    description="Project and task management service",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "name": "TaskFlow API",
        "version": "0.1.0",
        "docs": "/docs",
    }

app.include_router(auth_router)
app.include_router(tasks_router)
