from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import jwt
import bcrypt
from bson import ObjectId
from pydantic import BaseModel, EmailStr
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"
STATUSES = ["Pending", "Accepted", "Rejected", "In Progress", "Completed"]
ACTIVE_STATUSES = ["Pending", "Accepted", "In Progress"]

DEFAULT_SETTINGS = {
    "key": "global",
    "is_available": True,
    "holiday_mode": False,
    "working_hours": {"open": "09:00", "close": "19:00"},
    "max_bookings_per_slot": 3,
    "service_areas": ["Bangalore"],
}


# ---------------- Models ----------------
class BookingCreate(BaseModel):
    customer_name: str
    phone: str
    scooter_brand: str
    scooter_model: str
    scooter_issue: str
    location: str
    landmark: Optional[str] = ""
    slot_id: str
    slot_label: str


class StatusUpdate(BaseModel):
    status: str


class SlotCreate(BaseModel):
    label: str


class SlotUpdate(BaseModel):
    is_open: bool


class SettingsUpdate(BaseModel):
    is_available: bool
    holiday_mode: bool
    working_hours: dict
    max_bookings_per_slot: int
    service_areas: List[str]


class LoginInput(BaseModel):
    email: EmailStr
    password: str


# ---------------- Auth helpers ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------- Serialize helpers ----------------
def serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


async def get_settings_doc() -> dict:
    doc = await db.settings.find_one({"key": "global"})
    if doc is None:
        await db.settings.insert_one(dict(DEFAULT_SETTINGS))
        doc = await db.settings.find_one({"key": "global"})
    return doc


# ---------------- Admin seeding (lazy + idempotent, serverless-safe) ----------------
_admin_seeded = False


async def ensure_admin_seeded():
    global _admin_seeded
    if _admin_seeded:
        return
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@workshop.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "workshop123")
    await db.users.create_index("email", unique=True)
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Workshop Admin", "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info("Seeded admin user")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated admin password")
    _admin_seeded = True


# ---------------- Auth routes ----------------
@api_router.post("/auth/login")
async def login(payload: LoginInput, response: Response):
    try:
        await ensure_admin_seeded()
        email = payload.email.lower()
        user = await db.users.find_one({"email": email})
    except Exception as e:
        logger.error(f"Database error during login: {e}")
        raise HTTPException(status_code=503, detail="Cannot reach the database. Please try again.")
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")
    return {"id": str(user["_id"]), "email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["_id"], "email": current_user["email"],
            "name": current_user.get("name", "Admin"), "role": current_user.get("role", "admin")}


# ---------------- Public config & slots ----------------
@api_router.get("/config")
async def public_config():
    s = await get_settings_doc()
    return {
        "is_available": s["is_available"],
        "holiday_mode": s["holiday_mode"],
        "working_hours": s["working_hours"],
        "service_areas": s["service_areas"],
    }


@api_router.get("/slots/available")
async def available_slots():
    s = await get_settings_doc()
    if not s["is_available"] or s["holiday_mode"]:
        return []
    max_per = s["max_bookings_per_slot"]
    slots = await db.slots.find({"is_open": True}).sort("created_at", 1).to_list(200)
    out = []
    for slot in slots:
        count = await db.bookings.count_documents({"slot_id": str(slot["_id"]), "status": {"$in": ACTIVE_STATUSES}})
        remaining = max_per - count
        if remaining > 0:
            out.append({"id": str(slot["_id"]), "label": slot["label"], "remaining": remaining})
    return out


# ---------------- Bookings ----------------
@api_router.post("/bookings")
async def create_booking(payload: BookingCreate):
    s = await get_settings_doc()
    if not s["is_available"] or s["holiday_mode"]:
        raise HTTPException(status_code=400, detail="Bookings are currently closed. Please try again later.")
    slot = await db.slots.find_one({"_id": ObjectId(payload.slot_id), "is_open": True})
    if not slot:
        raise HTTPException(status_code=400, detail="Selected slot is no longer available.")
    count = await db.bookings.count_documents({"slot_id": payload.slot_id, "status": {"$in": ACTIVE_STATUSES}})
    if count >= s["max_bookings_per_slot"]:
        raise HTTPException(status_code=400, detail="This slot is fully booked. Please pick another slot.")
    doc = payload.model_dump()
    doc["status"] = "Pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.bookings.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@api_router.get("/bookings")
async def list_bookings(search: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if search:
        query = {"$or": [
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]}
    docs = await db.bookings.find(query).sort("created_at", -1).to_list(1000)
    return [serialize(d) for d in docs]


@api_router.get("/bookings/stats")
async def booking_stats(current_user: dict = Depends(get_current_user)):
    stats = {"total": await db.bookings.count_documents({})}
    for st in STATUSES:
        stats[st] = await db.bookings.count_documents({"status": st})
    return stats


@api_router.patch("/bookings/{booking_id}/status")
async def update_status(booking_id: str, payload: StatusUpdate, current_user: dict = Depends(get_current_user)):
    if payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.bookings.find_one_and_update(
        {"_id": ObjectId(booking_id)}, {"$set": {"status": payload.status}}, return_document=True)
    if not result:
        raise HTTPException(status_code=404, detail="Booking not found")
    return serialize(result)


# ---------------- Slots (admin) ----------------
@api_router.get("/slots")
async def list_slots(current_user: dict = Depends(get_current_user)):
    docs = await db.slots.find().sort("created_at", 1).to_list(200)
    out = []
    for slot in docs:
        count = await db.bookings.count_documents({"slot_id": str(slot["_id"]), "status": {"$in": ACTIVE_STATUSES}})
        d = serialize(slot)
        d["booked"] = count
        out.append(d)
    return out


@api_router.post("/slots")
async def create_slot(payload: SlotCreate, current_user: dict = Depends(get_current_user)):
    doc = {"label": payload.label, "is_open": True, "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.slots.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@api_router.patch("/slots/{slot_id}")
async def update_slot(slot_id: str, payload: SlotUpdate, current_user: dict = Depends(get_current_user)):
    result = await db.slots.find_one_and_update(
        {"_id": ObjectId(slot_id)}, {"$set": {"is_open": payload.is_open}}, return_document=True)
    if not result:
        raise HTTPException(status_code=404, detail="Slot not found")
    return serialize(result)


@api_router.delete("/slots/{slot_id}")
async def delete_slot(slot_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.slots.delete_one({"_id": ObjectId(slot_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    return {"message": "Slot deleted"}


# ---------------- Settings (admin) ----------------
@api_router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    s = await get_settings_doc()
    return serialize(s)


@api_router.put("/settings")
async def update_settings(payload: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    await get_settings_doc()
    await db.settings.update_one({"key": "global"}, {"$set": payload.model_dump()})
    s = await db.settings.find_one({"key": "global"})
    return serialize(s)


@api_router.get("/")
async def root():
    return {"message": "Scooter Workshop API"}


@api_router.get("/health")
async def health():
    info = {"status": "ok", "db": "unknown", "admin_seeded": _admin_seeded}
    try:
        await db.command("ping")
        info["db"] = "connected"
        info["admin_exists"] = (await db.users.find_one({"role": "admin"})) is not None
    except Exception as e:
        info["status"] = "error"
        info["db"] = f"error: {e}"
    return info


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        await ensure_admin_seeded()
        await get_settings_doc()
        logger.info("Startup complete")
    except Exception as e:
        logger.error(f"Startup failed (will retry lazily): {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
