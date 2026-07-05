from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Numeric, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum("admin", "waiter", "kitchen", "cashier", name="user_roles"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    sort_order = Column(Integer, default=0)

    items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("menu_categories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False, index=True)
    variant = Column(String(50), nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String(255), nullable=True)
    is_available = Column(Boolean, default=True)

    category = relationship("MenuCategory", back_populates="items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), index=True, nullable=False)
    business_date = Column(String(10), index=True, nullable=False)
    table_no = Column(String(20), nullable=True)
    order_type = Column(String(30), default="dine_in")
    status = Column(String(30), default="pending", index=True)  # pending, preparing, ready, served, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    price_at_time = Column(Numeric(10, 2), nullable=False)
    status = Column(String(30), default="pending")  # pending, preparing, ready, served
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    bill_number = Column(String(30), nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), default="Cash")
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="bills")
