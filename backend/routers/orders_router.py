from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer, cast
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/orders", tags=["Orders & Billing"])
bill_router = APIRouter(prefix="/api/bills", tags=["Bill History"])

def generate_order_number(db: Session):
    """Generate Next Order Number (6 AM Reset Rule)"""
    now = datetime.now()
    if now.hour < 6:
        business_date = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    else:
        business_date = now.strftime("%Y-%m-%d")

    # Cast to Integer so max is numeric ("10" > "9"), not alphabetical
    last_order_num = db.query(
        func.max(cast(models.Order.order_number, Integer))
    ).filter(
        models.Order.business_date == business_date
    ).scalar()

    next_order = (last_order_num or 0) + 1

    return {
        "number": str(next_order).zfill(4),
        "business_date": business_date
    }


def generate_bill_number(db: Session, business_date: str) -> str:
    """Generate a unique sequential bill number resetting daily (6 AM shift rule)."""
    count = db.query(func.count(models.Bill.id)).join(models.Order).filter(
        models.Order.business_date == business_date
    ).scalar() or 0
    formatted_date = business_date.replace("-", "")[2:] # e.g. "260709"
    return f"{formatted_date}-{str(count + 1).zfill(4)}"

def enrich_order_response(order: models.Order) -> schemas.OrderResponse:
    resp = schemas.OrderResponse.model_validate(order)
    total = 0.0
    for idx, item in enumerate(order.items):
        resp.items[idx].item_name = item.menu_item.name if item.menu_item else "Unknown Item"
        resp.items[idx].variant = item.menu_item.variant if item.menu_item else None
        total += float(item.price_at_time) * item.quantity
    resp.total_amount = total
    resp.has_bill = len(order.bills) > 0
    return resp

@router.post("", response_model=schemas.OrderResponse)
def create_order(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if order_in.order_type == "dine_in" and not order_in.table_no:
        raise HTTPException(status_code=400, detail="Table number required for Dine-In orders")
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    order_meta = generate_order_number(db)
    new_order = models.Order(
        order_number=order_meta["number"],
        business_date=order_meta["business_date"],
        table_no=order_in.table_no,
        order_type=order_in.order_type,
        status="pending"
    )
    db.add(new_order)
    db.flush()

    for item_in in order_in.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_in.item_id).first()
        if not menu_item:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Menu item ID {item_in.item_id} not found")
        
        price = item_in.price if item_in.price is not None else float(menu_item.price)
        order_item = models.OrderItem(
            order_id=new_order.id,
            item_id=menu_item.id,
            quantity=item_in.qty,
            price_at_time=price,
            status="pending"
        )
        db.add(order_item)

    db.commit()
    db.refresh(new_order)
    return enrich_order_response(new_order)

@router.post("/checkout", response_model=schemas.OrderResponse)
def direct_checkout(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin", "waiter", "cashier"]))
):
    """Direct POS checkout: creates order and generates paid bill immediately."""
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    order_meta = generate_order_number(db)
    new_order = models.Order(
        order_number=order_meta["number"],
        business_date=order_meta["business_date"],
        table_no=order_in.table_no,
        order_type=order_in.order_type,
        status="pending"
    )
    db.add(new_order)
    db.flush()

    total_amount = 0.0
    for item_in in order_in.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_in.item_id).first()
        if not menu_item:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Menu item ID {item_in.item_id} not found")
        
        price = item_in.price if item_in.price is not None else float(menu_item.price)
        order_item = models.OrderItem(
            order_id=new_order.id,
            item_id=menu_item.id,
            quantity=item_in.qty,
            price_at_time=price,
            status="pending"
        )
        db.add(order_item)
        total_amount += price * item_in.qty

    new_bill = models.Bill(
        order_id=new_order.id,
        bill_number=generate_bill_number(db, new_order.business_date),
        total_amount=total_amount,
        payment_method=order_in.payment_method or "Cash"
    )
    db.add(new_bill)

    db.commit()
    db.refresh(new_order)
    return enrich_order_response(new_order)

@router.get("", response_model=List[schemas.OrderResponse])
def get_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    table_no: Optional[str] = Query(None),
    business_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Order)
    if status_filter:
        if "," in status_filter:
            statuses = [s.strip() for s in status_filter.split(",")]
            query = query.filter(models.Order.status.in_(statuses))
        else:
            query = query.filter(models.Order.status == status_filter)
    if table_no:
        query = query.filter(models.Order.table_no == table_no)
    if business_date:
        query = query.filter(models.Order.business_date == business_date)

    orders = query.order_by(models.Order.id.desc()).all()
    return [enrich_order_response(o) for o in orders]

@router.get("/kitchen", response_model=List[schemas.OrderResponse])
def get_kitchen_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin", "kitchen", "waiter"]))
):
    orders = db.query(models.Order).filter(
        models.Order.status.in_(["pending", "preparing"])
    ).order_by(models.Order.id.asc()).all()
    return [enrich_order_response(o) for o in orders]

@router.put("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    status_in: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if status_in.status == "served" and len(order.bills) > 0:
        order.status = "completed"
    else:
        order.status = status_in.status

    # If all items status need update too:
    for item in order.items:
        if status_in.status in ["preparing", "ready", "served"]:
            item.status = status_in.status

    db.commit()
    db.refresh(order)
    return enrich_order_response(order)

@router.post("/{order_id}/bill", response_model=schemas.BillResponse)
def create_order_bill(
    order_id: int,
    bill_in: schemas.BillCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin", "waiter", "cashier"]))
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    new_bill = models.Bill(
        order_id=order.id,
        bill_number=generate_bill_number(db, order.business_date),
        total_amount=bill_in.total_amount,
        payment_method=bill_in.payment_method
    )
    order.status = "completed"
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    return new_bill


# ─────────────────────────────────────────────
# Bill History Endpoint
# ─────────────────────────────────────────────

@bill_router.get("")
def get_bill_history(
    limit: int = Query(200, ge=1, le=500),
    business_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin", "cashier"]))
):
    """Return full bill history with order items for the frontend history view."""
    query = db.query(models.Bill).join(models.Order)
    if business_date:
        query = query.filter(models.Order.business_date == business_date)
    bills = query.order_by(models.Bill.id.desc()).limit(limit).all()

    result = []
    for b in bills:
        order = b.order
        items = []
        for oi in order.items:
            items.append({
                "item_name": oi.menu_item.name if oi.menu_item else "Unknown",
                "variant": oi.menu_item.variant if oi.menu_item else None,
                "quantity": oi.quantity,
                "price_at_time": float(oi.price_at_time),
            })
        result.append({
            "id": b.id,
            "bill_number": b.bill_number,
            "order_id": b.order_id,
            "order_number": order.order_number,
            "order_type": order.order_type,
            "table_no": order.table_no,
            "business_date": order.business_date,
            "payment_method": b.payment_method,
            "total_amount": float(b.total_amount),
            "created_at": b.created_at.strftime("%Y-%m-%dT%H:%M:%S"),
            "items": items,
        })
    return result
