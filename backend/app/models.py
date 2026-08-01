from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


StorageLocation = Literal["冰箱冷藏", "冷凍庫", "常溫儲藏", "飲品櫃"]


def ensure_iso_date(value: str) -> str:
    try:
        date.fromisoformat(value)
    except ValueError as error:
        raise ValueError("日期格式必須是 YYYY-MM-DD") from error
    return value


class FoodBase(BaseModel):
    """新增與編輯共用的食材欄位與驗證規則。"""

    name: str = Field(..., min_length=1)
    category: str = "其他"
    storage_location: StorageLocation = "冰箱冷藏"
    quantity: str = "未記錄"
    price: int = Field(default=0, ge=0)
    purchase_date: str | None = None
    expiry_date: str
    note: str = "未記錄"

    @field_validator("expiry_date")
    @classmethod
    def validate_expiry_date(cls, value: str) -> str:
        return ensure_iso_date(value)

    @field_validator("purchase_date")
    @classmethod
    def validate_purchase_date(cls, value: str | None) -> str | None:
        if not value:
            return None
        return ensure_iso_date(value)

    @model_validator(mode="after")
    def validate_date_order(self) -> "FoodBase":
        if self.purchase_date and self.expiry_date < self.purchase_date:
            raise ValueError("到期日期不能早於購買日期")
        return self


class FoodCreate(FoodBase):
    added_by: str = "訪客"


class FoodUpdate(FoodBase):
    """v11.2 完整編輯食材，包含儲存位置。"""

    updated_by: str = "訪客"


class FoodStatusUpdate(BaseModel):
    status: Literal["active", "used"]
    used_by: str = "訪客"


class FoodQuantityUpdate(BaseModel):
    delta: Literal[-1, 1]
    updated_by: str = "訪客"


class FoodResponse(BaseModel):
    id: int
    family_code: str
    name: str
    category: str
    storage_location: str
    quantity: str
    price: int
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
