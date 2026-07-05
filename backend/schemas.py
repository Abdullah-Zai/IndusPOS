from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

# User Schemas
class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Menu Schemas
class MenuCategoryBase(BaseModel):
    name: str
    sort_order: Optional[int] = 0

class MenuCategoryCreate(MenuCategoryBase):
    pass

class MenuCategoryResponse(MenuCategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class MenuItemBase(BaseModel):
    category_id: int
    name: str
    variant: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: Optional[bool] = True

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    variant: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None

class MenuItemResponse(MenuItemBase):
    id: int
    category_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Order Schemas
class OrderItemCreate(BaseModel):
    item_id: int
    qty: int = Field(alias="quantity", default=1)
    price: Optional[float] = None
    model_config = ConfigDict(populate_by_name=True)

class OrderCreate(BaseModel):
    table_no: Optional[str] = None
    order_type: Optional[str] = "dine_in"
    items: List[OrderItemCreate]
    payment_method: Optional[str] = "Cash"

class OrderItemResponse(BaseModel):
    id: int
    item_id: int
    quantity: int
    price_at_time: float
    status: str
    item_name: Optional[str] = None
    variant: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: int
    order_number: str
    business_date: str
    table_no: Optional[str] = None
    order_type: str
    status: str
    created_at: datetime
    items: List[OrderItemResponse] = []
    total_amount: Optional[float] = 0.0
    has_bill: bool = False
    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str

# Bill Schemas
class BillCreate(BaseModel):
    order_id: int
    total_amount: float
    payment_method: Optional[str] = "Cash"

class BillResponse(BaseModel):
    id: int
    order_id: int
    bill_number: Optional[str] = None
    total_amount: float
    payment_method: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
