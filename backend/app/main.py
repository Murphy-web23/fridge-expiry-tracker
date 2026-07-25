from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.mock_data import (
    FAMILIES,
    MEMBERS,
    add_food,
    list_foods,
    update_food_quantity,
    update_food_status,
)
from app.models import (
    FamilyResponse,
    FoodCreate,
    FoodQuantityUpdate,
    FoodResponse,
    FoodStatusUpdate,
    MemberResponse,
)


app = FastAPI(
    title="食材期限管理工具 API",
    description="v10 FastAPI 雛形，提供 React 前端食材期限與採買金額功能。",
    version="0.3.0",
)

# v9 先允許本機 Vite 常用 port，方便前端開發時直接呼叫 API。
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4174",
        "http://127.0.0.1:4174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "version": "v10"}


@app.get("/families", response_model=list[FamilyResponse])
def get_families() -> list[dict]:
    """提供前端家庭下拉選單使用。"""
    return list(FAMILIES.values())


@app.get("/families/{family_code}", response_model=FamilyResponse)
def get_family(family_code: str) -> dict:
    family = FAMILIES.get(family_code)
    if not family:
        raise HTTPException(status_code=404, detail="找不到家庭資料")
    return family


@app.get("/families/{family_code}/members", response_model=list[MemberResponse])
def get_members(family_code: str) -> list[dict]:
    if family_code not in FAMILIES:
        raise HTTPException(status_code=404, detail="找不到家庭資料")
    return MEMBERS.get(family_code, [])


@app.get("/families/{family_code}/foods", response_model=list[FoodResponse])
def get_foods(family_code: str) -> list[dict]:
    if family_code not in FAMILIES:
        raise HTTPException(status_code=404, detail="找不到家庭資料")
    return list_foods(family_code)


@app.post("/families/{family_code}/foods", response_model=FoodResponse, status_code=201)
def create_food(family_code: str, food_create: FoodCreate) -> dict:
    if family_code not in FAMILIES:
        raise HTTPException(status_code=404, detail="找不到家庭資料")
    return add_food(family_code, food_create)


@app.patch("/families/{family_code}/foods/{food_id}/status", response_model=FoodResponse)
def patch_food_status(
    family_code: str,
    food_id: int,
    status_update: FoodStatusUpdate,
) -> dict:
    if family_code not in FAMILIES:
        raise HTTPException(status_code=404, detail="找不到家庭資料")

    food = update_food_status(
        family_code=family_code,
        food_id=food_id,
        status=status_update.status,
        used_by=status_update.used_by,
    )
    if not food:
        raise HTTPException(status_code=404, detail="找不到食材資料")
    return food


@app.patch("/families/{family_code}/foods/{food_id}/quantity", response_model=FoodResponse)
def patch_food_quantity(
    family_code: str,
    food_id: int,
    quantity_update: FoodQuantityUpdate,
) -> dict:
    if family_code not in FAMILIES:
        raise HTTPException(status_code=404, detail="找不到家庭資料")

    food = update_food_quantity(
        family_code=family_code,
        food_id=food_id,
        delta=quantity_update.delta,
        updated_by=quantity_update.updated_by,
    )
    if not food:
        raise HTTPException(status_code=400, detail="這筆食材的數量格式無法使用加減按鈕")
    return food
