from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/users", tags=["Users Management"])

VALID_ROLES = {"admin", "waiter", "kitchen", "cashier"}


class UserUpdate(BaseModel):
    role: Optional[str] = None
    password: Optional[str] = None
    username: Optional[str] = None


@router.get("", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    return db.query(models.User).order_by(models.User.id.asc()).all()


@router.post("", response_model=schemas.UserResponse)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    if user_in.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
    existing = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed = auth.get_password_hash(user_in.password)
    new_user = models.User(
        username=user_in.username,
        password=hashed,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    update_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    """Admin can update any user's role, username, or reset their password."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent downgrading your own admin account
    if user_id == current_user.id and update_in.role and update_in.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    if update_in.role:
        if update_in.role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
        user.role = update_in.role

    if update_in.username and update_in.username != user.username:
        existing = db.query(models.User).filter(models.User.username == update_in.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = update_in.username

    if update_in.password:
        if len(update_in.password) < 4:
            raise HTTPException(status_code=400, detail="Password must be at least 4 characters")
        user.password = auth.get_password_hash(update_in.password)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(["admin"]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return None
