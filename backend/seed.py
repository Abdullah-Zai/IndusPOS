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
            existing = db.query(models.User).filter(models.User.username == u["username"]).first()
            if not existing:
                # Only create default users — never overwrite existing passwords
                hashed = auth.get_password_hash(u["password"])
                db.add(models.User(username=u["username"], password=hashed, role=u["role"]))
                print(f"  Created default user: {u['username']} ({u['role']})")
            else:
                print(f"  Skipping existing user: {u['username']} (password preserved)")
        db.commit()
        print("Default users ready.")

        # 2. Clear existing menu categories and items (removes other items)
        print("Clearing old menu items and categories...")
        db.query(models.OrderItem).delete()
        db.query(models.MenuItem).delete()
        db.query(models.MenuCategory).delete()
        db.commit()

        # 3. Seed Menu Categories
        print("Seeding default categories...")
        categories_to_seed = [
            {"name": "Desi Portion", "sort_order": 1},
            {"name": "Fast Food", "sort_order": 2},
            {"name": "Drinks", "sort_order": 3},
        ]
        category_map = {}
        for c in categories_to_seed:
            existing = models.MenuCategory(name=c["name"], sort_order=c["sort_order"])
            db.add(existing)
            db.commit()
            db.refresh(existing)
            category_map[c["name"]] = existing.id

        # 4. Seed Menu Items (Only items with local images)
        print("Seeding default menu items...")
        menu_items_to_seed = [
            # Desi Portion (Local Images)
            {"category_name": "Desi Portion", "name": "Chicken Karahi", "variant": "Full", "price": 1800.00, "image_url": "/static/uploads/chicken karahi.jpg"},
            {"category_name": "Desi Portion", "name": "Chicken Karahi", "variant": "Half", "price": 1000.00, "image_url": "/static/uploads/chicken karahi.jpg"},
            {"category_name": "Desi Portion", "name": "Mutton Karahi", "variant": "Full", "price": 2800.00, "image_url": "/static/uploads/mutton karahi.jpg"},
            {"category_name": "Desi Portion", "name": "Mutton Karahi", "variant": "Half", "price": 1600.00, "image_url": "/static/uploads/mutton karahi.jpg"},
            {"category_name": "Desi Portion", "name": "Daal Chana Fry", "variant": "Regular", "price": 400.00, "image_url": "/static/uploads/chana dal.jpg"},
            {"category_name": "Desi Portion", "name": "Beef Seekh Kabab", "variant": "Plate", "price": 700.00, "image_url": "/static/uploads/seekh kabab.jpg"},
            {"category_name": "Desi Portion", "name": "Chicken Tikka Leg", "variant": "Piece", "price": 320.00, "image_url": "/static/uploads/tikka leg.jpg"},
            {"category_name": "Desi Portion", "name": "Chicken Tikka Chest", "variant": "Piece", "price": 350.00, "image_url": "/static/uploads/tiika chest.jpg"},
            
            # Fast Food (Local Images)
            {"category_name": "Fast Food", "name": "Chicken Zinger Burger", "variant": "Regular", "price": 450.00, "image_url": "/static/uploads/zinger.jpg"},
            {"category_name": "Fast Food", "name": "Chicken Broast", "variant": "Quarter", "price": 500.00, "image_url": "/static/uploads/broast.jpg"},
            {"category_name": "Fast Food", "name": "Special Chicken Pizza", "variant": "Small", "price": 600.00, "image_url": "/static/uploads/pizza.jpg"},
            {"category_name": "Fast Food", "name": "Special Chicken Pizza", "variant": "Medium", "price": 950.00, "image_url": "/static/uploads/pizza.jpg"},
            {"category_name": "Fast Food", "name": "Special Chicken Pizza", "variant": "Large", "price": 1400.00, "image_url": "/static/uploads/pizza.jpg"},
            {"category_name": "Fast Food", "name": "Extra Pizza Toppings", "variant": "Portion", "price": 150.00, "image_url": "/static/uploads/Toppings.jpg"},

            # Drinks (Local Images)
            {"category_name": "Drinks", "name": "Lassi", "variant": "Sweet", "price": 180.00, "image_url": "/static/uploads/lassi.jpg"},
            {"category_name": "Drinks", "name": "Lassi", "variant": "Salty", "price": 180.00, "image_url": "/static/uploads/lassi.jpg"},
            {"category_name": "Drinks", "name": "Soft Drink", "variant": "Can", "price": 120.00, "image_url": "/static/uploads/cold drinks.jpg"},
            {"category_name": "Drinks", "name": "Mineral Water", "variant": "Bottle", "price": 80.00, "image_url": "/static/uploads/water bottle.jpg"},
        ]

        for item in menu_items_to_seed:
            cat_id = category_map.get(item["category_name"])
            if cat_id:
                new_item = models.MenuItem(
                    category_id=cat_id,
                    name=item["name"],
                    variant=item["variant"],
                    price=item["price"],
                    is_available=True,
                    image_url=item["image_url"]
                )
                db.add(new_item)
        db.commit()
        print("Menu seeded successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
