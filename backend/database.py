import os
import time
import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "restaurant_pos")

def ensure_database_exists():
    """Ensure the PostgreSQL database exists before connecting SQLAlchemy."""
    retries = 15
    delay = 2
    for i in range(retries):
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASS,
                port=DB_PORT,
                dbname="postgres"
            )
            conn.autocommit = True
            cursor = conn.cursor()
            cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{DB_NAME}'")
            exists = cursor.fetchone()
            if not exists:
                cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
                print(f"Database {DB_NAME} created successfully.")
            cursor.close()
            conn.close()
            return
        except Exception as e:
            print(f"Attempt {i+1}/{retries}: Could not check/create database: {e}")
            if i < retries - 1:
                time.sleep(delay)
            else:
                print("Failed to ensure database exists after all retries.")
                raise e

# Ensure database exists when imported
ensure_database_exists()

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
