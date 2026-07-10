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
    current_user: models.User = Depends(auth.require_roles(["admin", "cashier"]))
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

@router.get("/daily")
def get_daily_sales(
    month: Optional[str] = Query(None, description="YYYY-MM"),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin", "cashier"]))
):
    """Returns daily sales count and revenue, grouping by business date. Only counts days with sales."""
    query = db.query(
        models.Order.business_date,
        func.count(models.Bill.id).label("bill_count"),
        func.sum(models.Bill.total_amount).label("daily_revenue")
    ).join(models.Bill, models.Order.id == models.Bill.order_id)

    if month:
        query = query.filter(models.Order.business_date.like(f"{month}-%"))
    if start_date:
        query = query.filter(models.Order.business_date >= start_date)
    if end_date:
        query = query.filter(models.Order.business_date <= end_date)

    results = query.group_by(models.Order.business_date).order_by(models.Order.business_date.desc()).all()

    return [
        {
            "date": row.business_date,
            "sales_count": int(row.bill_count or 0),
            "revenue": round(float(row.daily_revenue or 0), 2)
        }
        for row in results
    ]

@router.get("/monthly")
def get_monthly_sales(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    bills = db.query(models.Bill).join(models.Order).all()
    monthly_data = {}
    for b in bills:
        # Use business_date (YYYY-MM prefix) — consistent with the 6AM shift rule
        month_str = b.order.business_date[:7]
        monthly_data[month_str] = monthly_data.get(month_str, 0.0) + float(b.total_amount)

    return [
        {"month": m, "revenue": round(rev, 2)}
        for m, rev in sorted(monthly_data.items(), reverse=True)
    ]

@router.post("/reset")
def reset_database(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    try:
        db.query(models.Bill).delete()
        db.query(models.OrderItem).delete()
        db.query(models.Order).delete()
        db.commit()
        return {"status": "success", "message": "Transaction logs and orders reset successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
