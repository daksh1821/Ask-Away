from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routes import auth as auth_router, questions as q_router, answers as answers_router

# create tables at start (safe)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Q&A Platform")# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routes import auth as auth_router, questions as q_router, answers as answers_router

# create tables at start (safe)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Q&A Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Q&A Platform API!"}

# Mount routers under /api so frontend baseURL '/api' matches
app.include_router(auth_router.router, prefix="/api")
app.include_router(q_router.router, prefix="/api")
app.include_router(answers_router.router, prefix="/api")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Q&A Platform API!"}

app.include_router(auth_router.router)
app.include_router(q_router.router)
app.include_router(answers_router.router)
