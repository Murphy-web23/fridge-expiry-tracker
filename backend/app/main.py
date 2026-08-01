from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from app import db, repository
from app.models import (
    FamilyResponse,
    FoodCreate,
    FoodQuantityUpdate,
    FoodResponse,
    FoodStatusUpdate,
    FoodUpdate,
    HealthResponse,
    MemberResponse,
)


API_VERSION = "v12"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """啟動時建立或補齊資料表，資料庫還空著時才寫入示範資料。"""
    db.init_db()
    repository.ensure_seed_data()
    yield


app = FastAPI(
    title="食材期限管理工具 API",
    description="v12 FastAPI 後端，資料保存在 SQLite 或 PostgreSQL，重啟服務後資料仍在。",
    version="0.5.0",
    lifespan=lifespan,
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


def ensure_family(family_code: str) -> None:
    if not repository.get_family(family_code):
        raise HTTPException(status_code=404, detail="找不到家庭資料")


def ensure_food(family_code: str, food_id: int) -> None:
    ensure_family(family_code)
    if not repository.find_food(family_code, food_id):
        raise HTTPException(status_code=404, detail="找不到食材資料")


@app.get("/health", response_model=HealthResponse)
def health_check() -> dict:
    """v12 起一併回報目前用哪一種資料庫，前端可以直接顯示資料保存狀態。"""
    return {
        "status": "ok",
        "version": API_VERSION,
        "database": db.database_label(),
        "database_location": db.database_location(),
        "food_count": repository.count_foods(),
    }


@app.get("/families", response_model=list[FamilyResponse])
def get_families() -> list[dict]:
    """提供前端家庭下拉選單使用。"""
    return repository.list_families()


@app.get("/families/{family_code}", response_model=FamilyResponse)
def get_family(family_code: str) -> dict:
    family = repository.get_family(family_code)
    if not family:
        raise HTTPException(status_code=404, detail="找不到家庭資料")
    return family


@app.get("/families/{family_code}/members", response_model=list[MemberResponse])
def get_members(family_code: str) -> list[dict]:
    ensure_family(family_code)
    return repository.list_members(family_code)


@app.get("/families/{family_code}/foods", response_model=list[FoodResponse])
def get_foods(family_code: str) -> list[dict]:
    ensure_family(family_code)
    return repository.list_foods(family_code)


@app.post("/families/{family_code}/foods", response_model=FoodResponse, status_code=201)
def create_food(family_code: str, food_create: FoodCreate) -> dict:
    ensure_family(family_code)
    return repository.add_food(family_code, food_create)


@app.put("/families/{family_code}/foods/{food_id}", response_model=FoodResponse)
def put_food(family_code: str, food_id: int, food_update: FoodUpdate) -> dict:
    """v11.2 完整編輯，前端編輯視窗會一次送出所有欄位。"""
    ensure_food(family_code, food_id)
    return repository.update_food(family_code, food_id, food_update)


@app.delete("/families/{family_code}/foods/{food_id}", status_code=204)
def remove_food(family_code: str, food_id: int) -> Response:
    ensure_food(family_code, food_id)
    repository.delete_food(family_code, food_id)
    return Response(status_code=204)


@app.patch("/families/{family_code}/foods/{food_id}/status", response_model=FoodResponse)
def patch_food_status(
    family_code: str,
    food_id: int,
    status_update: FoodStatusUpdate,
) -> dict:
    ensure_food(family_code, food_id)
    return repository.update_food_status(
        family_code=family_code,
        food_id=food_id,
        status=status_update.status,
        used_by=status_update.used_by,
    )


@app.patch("/families/{family_code}/foods/{food_id}/quantity", response_model=FoodResponse)
def patch_food_quantity(
    family_code: str,
    food_id: int,
    quantity_update: FoodQuantityUpdate,
) -> dict:
    ensure_food(family_code, food_id)

    food = repository.update_food_quantity(
        family_code=family_code,
        food_id=food_id,
        delta=quantity_update.delta,
        updated_by=quantity_update.updated_by,
    )
    if not food:
        raise HTTPException(status_code=400, detail="這筆食材的數量格式無法使用加減按鈕")
    return food
