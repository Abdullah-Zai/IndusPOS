from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/menu", tags=["Menu"])

# --- Categories ---
@router.get("/categories", response_model=List[schemas.MenuCategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.MenuCategory).order_by(models.MenuCategory.sort_order.asc(), models.MenuCategory.name.asc()).all()

@router.post("/categories", response_model=schemas.MenuCategoryResponse)
def create_category(
    cat_in: schemas.MenuCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    existing = db.query(models.MenuCategory).filter(models.MenuCategory.name == cat_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    new_cat = models.MenuCategory(**cat_in.model_dump())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    cat = db.query(models.MenuCategory).filter(models.MenuCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return None

# --- Menu Items ---
@router.get("/items", response_model=List[schemas.MenuItemResponse])
def get_items(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    is_available: Optional[bool] = Query(None, description="Filter by availability"),
    db: Session = Depends(get_db)
):
    query = db.query(models.MenuItem).join(models.MenuCategory)
    if category_id is not None:
        query = query.filter(models.MenuItem.category_id == category_id)
    if is_available is not None:
        query = query.filter(models.MenuItem.is_available == is_available)
    
    items = query.order_by(models.MenuCategory.sort_order.asc(), models.MenuItem.name.asc()).all()
    # Populate category_name
    result = []
    for item in items:
        resp = schemas.MenuItemResponse.model_validate(item)
        resp.category_name = item.category.name if item.category else None
        result.append(resp)
    return result

@router.post("/items", response_model=schemas.MenuItemResponse)
def create_item(
    item_in: schemas.MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    category = db.query(models.MenuCategory).filter(models.MenuCategory.id == item_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid Category ID")

    new_item = models.MenuItem(**item_in.model_dump())
    if not new_item.image_url:
        new_item.image_url = f"https://placehold.co/300x200?text={new_item.name}+{new_item.variant or ''}".replace(" ", "+")
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    resp = schemas.MenuItemResponse.model_validate(new_item)
    resp.category_name = new_item.category.name if new_item.category else None
    return resp

@router.put("/items/{item_id}", response_model=schemas.MenuItemResponse)
def update_item(
    item_id: int,
    item_in: schemas.MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
        
    db.commit()
    db.refresh(item)
    resp = schemas.MenuItemResponse.model_validate(item)
    resp.category_name = item.category.name if item.category else None
    return resp

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return None

import os
import shutil
import datetime
from fastapi import UploadFile, File

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-image")
def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file type")
    
    timestamp = int(datetime.datetime.now().timestamp())
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"image_url": f"/static/uploads/{filename}"}
