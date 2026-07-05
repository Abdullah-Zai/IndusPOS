import urllib.parse
from database import engine, SessionLocal, Base, ensure_database_exists
import models, auth

def seed_database():
    print("Ensuring database exists...")
    ensure_database_exists()

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Users
        print("Ensuring default users exist with correct passwords...")
        default_users = [
            {"username": "admin", "password": "admin123", "role": "admin"},
            {"username": "waiter", "password": "waiter123", "role": "waiter"},
            {"username": "kitchen", "password": "kitchen123", "role": "kitchen"},
            {"username": "cashier", "password": "cashier123", "role": "cashier"},
        ]
        for u in default_users:
            hashed = auth.get_password_hash(u["password"])
            existing = db.query(models.User).filter(models.User.username == u["username"]).first()
            if existing:
                existing.password = hashed
                existing.role = u["role"]
            else:
                db.add(models.User(username=u["username"], password=hashed, role=u["role"]))
        db.commit()
        print("Default users ready (admin: admin123, waiter: waiter123, kitchen: kitchen123, cashier: cashier123).")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
