from typing import Literal

from pydantic import BaseModel, Field


class FoodCreate(BaseModel):
    name: str = Field(..., min_length=1)
    category: str = "其他"
    quantity: str = "未記錄"
    purchase_date: str | None = None
    expiry_date: str
    note: str = "未記錄"
    added_by: str = "訪客"


class FoodStatusUpdate(BaseModel):
    status: Literal["active", "used"]
    used_by: str = "訪客"


class FoodResponse(BaseModel):
    id: int
    family_code: str
    name: str
    category: str
    quantity: str
    purchase_date: str | None
    expiry_date: str
    days_left: int
    status: str
    status_label: str
    note: str
    added_by: str
    used_by: str | None = None
    used_at: str | None = None
    updated_by: str | None = None
    updated_at: str | None = None
    created_at: str


class FamilyResponse(BaseModel):
    family_code: str
    family_name: str
    created_at: str


class MemberResponse(BaseModel):
    family_code: str
    member_name: str
    role: str
    joined_at: str
