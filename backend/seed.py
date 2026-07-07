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
        print("Default users ready.")

        # 2. Seed Menu Categories
        print("Seeding default categories...")
        categories_to_seed = [
            {"name": "Karahi & Handi", "sort_order": 1},
            {"name": "BBQ", "sort_order": 2},
            {"name": "Rice Dishes", "sort_order": 3},
            {"name": "Tandoor", "sort_order": 4},
            {"name": "Beverages", "sort_order": 5},
        ]
        category_map = {}
        for c in categories_to_seed:
            existing = db.query(models.MenuCategory).filter(models.MenuCategory.name == c["name"]).first()
            if not existing:
                existing = models.MenuCategory(name=c["name"], sort_order=c["sort_order"])
                db.add(existing)
                db.commit()
                db.refresh(existing)
            category_map[c["name"]] = existing.id

        # 3. Seed Menu Items (Pakistani Desi Dishes)
        print("Seeding default Desi menu items...")
        menu_items_to_seed = [
            {"category_name": "Karahi & Handi", "name": "Chicken Karahi", "variant": "Full", "price": 1800.00, "image_url": "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop"},
            {"category_name": "Karahi & Handi", "name": "Chicken Karahi", "variant": "Half", "price": 1000.00, "image_url": "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop"},
            {"category_name": "Karahi & Handi", "name": "Mutton Karahi", "variant": "Full", "price": 2800.00, "image_url": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&auto=format&fit=crop"},
            {"category_name": "Karahi & Handi", "name": "Mutton Karahi", "variant": "Half", "price": 1600.00, "image_url": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&auto=format&fit=crop"},
            {"category_name": "Karahi & Handi", "name": "Chicken Makhni Handi", "variant": "Regular", "price": 1500.00, "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop"},
            
            {"category_name": "BBQ", "name": "Chicken Boti", "variant": "Plate", "price": 600.00, "image_url": "https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=500&auto=format&fit=crop"},
            {"category_name": "BBQ", "name": "Chicken Malai Boti", "variant": "Plate", "price": 750.00, "image_url": "https://images.unsplash.com/photo-1628294895950-9805252327bc?w=500&auto=format&fit=crop"},
            {"category_name": "BBQ", "name": "Beef Seekh Kabab", "variant": "Plate", "price": 700.00, "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop"},
            
            {"category_name": "Rice Dishes", "name": "Chicken Biryani", "variant": "Single", "price": 300.00, "image_url": "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop"},
            {"category_name": "Rice Dishes", "name": "Chicken Biryani", "variant": "Double", "price": 450.00, "image_url": "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop"},
            {"category_name": "Rice Dishes", "name": "Mutton Palao", "variant": "Plate", "price": 650.00, "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop"},
            
            {"category_name": "Tandoor", "name": "Roti", "variant": "Tandoori", "price": 30.00, "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop"},
            {"category_name": "Tandoor", "name": "Naan", "variant": "Plain", "price": 40.00, "image_url": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&auto=format&fit=crop"},
            {"category_name": "Tandoor", "name": "Garlic Naan", "variant": "Butter", "price": 80.00, "image_url": "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop"},
            
            {"category_name": "Beverages", "name": "Mint Margarita", "variant": "Glass", "price": 250.00, "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop"},
            {"category_name": "Beverages", "name": "Soft Drink", "variant": "Can", "price": 120.00, "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop"},
            {"category_name": "Beverages", "name": "Lassi", "variant": "Sweet", "price": 180.00, "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop"},
            {"category_name": "Beverages", "name": "Lassi", "variant": "Salty", "price": 180.00, "image_url": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop"},
        ]

        for item in menu_items_to_seed:
            cat_id = category_map.get(item["category_name"])
            if cat_id:
                existing = db.query(models.MenuItem).filter(
                    models.MenuItem.category_id == cat_id,
                    models.MenuItem.name == item["name"],
                    models.MenuItem.variant == item["variant"]
                ).first()
                if not existing:
                    new_item = models.MenuItem(
                        category_id=cat_id,
                        name=item["name"],
                        variant=item["variant"],
                        price=item["price"],
                        is_available=True,
                        image_url=item["image_url"]
                    )
                    db.add(new_item)
                else:
                    # Update image URL for existing items if they changed
                    existing.image_url = item["image_url"]
        db.commit()
        print("Menu seeded successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
