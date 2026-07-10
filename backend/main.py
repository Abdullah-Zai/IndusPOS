import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
import seed
from routers import auth_router, menu_router, orders_router, users_router, reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database and tables on startup
    try:
        seed.seed_database()
    except Exception as e:
        print(f"Startup initialization error: {e}")
    yield

app = FastAPI(
    title="Indus Hotel POS API",
    description="Python FastAPI backend replacing PHP for Indus Hotel Restaurant POS",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS — restrict to known origins via FRONTEND_URL env var
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_frontend_url, "http://localhost:3000", "http://localhost:80", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router.router)
app.include_router(menu_router.router)
app.include_router(orders_router.router)
app.include_router(orders_router.bill_router)
app.include_router(users_router.router)
app.include_router(reports_router.router)

os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def root():
    return {
        "message": "Welcome to Indus Hotel POS API (FastAPI)",
        "docs_url": "/docs",
        "status": "running"
    }
