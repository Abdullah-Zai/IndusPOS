from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Configure CORS for frontend dev server & docker
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router.router)
app.include_router(menu_router.router)
app.include_router(orders_router.router)
app.include_router(users_router.router)
app.include_router(reports_router.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Indus Hotel POS API (FastAPI)",
        "docs_url": "/docs",
        "status": "running"
    }
