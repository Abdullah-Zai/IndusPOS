from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models, auth

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/summary")
def get_sales_summary(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    query = db.query(models.Bill).join(models.Order)
    if start_date:
        query = query.filter(models.Order.business_date >= start_date)
    if end_date:
        query = query.filter(models.Order.business_date <= end_date)
    
    bills = query.all()
    total_revenue = sum(float(b.total_amount) for b in bills)
    total_orders = len(bills)
    avg_order = total_revenue / total_orders if total_orders > 0 else 0.0

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "average_order_value": round(avg_order, 2),
        "start_date": start_date,
        "end_date": end_date
    }

@router.get("/top-items")
def get_top_items(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    results = db.query(
        models.MenuItem.name,
        models.MenuItem.variant,
        func.sum(models.OrderItem.quantity).label("total_qty"),
        func.sum(models.OrderItem.quantity * models.OrderItem.price_at_time).label("total_rev")
    ).join(models.OrderItem, models.MenuItem.id == models.OrderItem.item_id)\
     .join(models.Order, models.OrderItem.order_id == models.Order.id)\
     .filter(models.Order.status != "cancelled")\
     .group_by(models.MenuItem.id)\
     .order_by(func.sum(models.OrderItem.quantity).desc())\
     .limit(limit).all()

    return [
        {
            "name": row.name,
            "variant": row.variant,
            "total_quantity_sold": int(row.total_qty or 0),
            "total_revenue": round(float(row.total_rev or 0), 2)
        }
        for row in results
    ]

@router.get("/recent-bills")
def get_recent_bills(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    bills = db.query(models.Bill).order_by(models.Bill.id.desc()).limit(limit).all()
    return [
        {
            "id": b.id,
            "bill_number": b.bill_number,
            "order_id": b.order_id,
            "total_amount": float(b.total_amount),
            "payment_method": b.payment_method,
            "created_at": b.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for b in bills
    ]
