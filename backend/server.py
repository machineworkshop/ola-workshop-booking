from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

import jwt
import bcrypt
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator, EmailStr
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

# ---------------- DB ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"
STATUSES = ["Pending", "In Progress", "Completed"]


# ---------------- Models ----------------
def _validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


class BookingCreate(BaseModel):
    customer_name: str
    place: str
    phone: str
    scooter_brand: str
    scooter_model: str
    scooter_issue: str
    preferred_date: str


class Booking(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    customer_name: str
    place: str
    phone: str
    scooter_brand: str
    scooter_model: str
    scooter_issue: str
    preferred_date: str
    status: str = "Pending"
    created_at: str


class StatusUpdate(BaseModel):
    status: str


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


# ---------------- Admin seeding (lazy + idempotent, serverless-safe) ----------------
_admin_seeded = False


async def ensure_admin_seeded():
    """Seed the admin account on demand. Works even when startup events do not
    fire (e.g. Vercel serverless). Idempotent and cached per warm instance."""
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
        raise HTTPException(status_code=503, detail="Cannot reach the database. Please check the server configuration and try again.")
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


# ---------------- Booking routes ----------------
@api_router.post("/bookings", response_model=Booking, response_model_by_alias=False)
async def create_booking(payload: BookingCreate):
    doc = payload.model_dump()
    doc["status"] = "Pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.bookings.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return Booking(**doc)


@api_router.get("/bookings", response_model=List[Booking], response_model_by_alias=False)
async def list_bookings(current_user: dict = Depends(get_current_user)):
    docs = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [Booking(**{**d, "_id": str(d["_id"])}) for d in docs]


@api_router.get("/bookings/stats")
async def booking_stats(current_user: dict = Depends(get_current_user)):
    total = await db.bookings.count_documents({})
    pending = await db.bookings.count_documents({"status": "Pending"})
    in_progress = await db.bookings.count_documents({"status": "In Progress"})
    completed = await db.bookings.count_documents({"status": "Completed"})
    return {"total": total, "pending": pending, "in_progress": in_progress, "completed": completed}


@api_router.patch("/bookings/{booking_id}/status", response_model=Booking, response_model_by_alias=False)
async def update_status(booking_id: str, payload: StatusUpdate, current_user: dict = Depends(get_current_user)):
    if payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.bookings.find_one_and_update(
        {"_id": ObjectId(booking_id)}, {"$set": {"status": payload.status}}, return_document=True)
    if not result:
        raise HTTPException(status_code=404, detail="Booking not found")
    result["_id"] = str(result["_id"])
    return Booking(**result)


@api_router.get("/")
async def root():
    return {"message": "Scooter Workshop API"}


@api_router.get("/health")
async def health():
    """Report backend + MongoDB connectivity. Useful to diagnose deployments."""
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
        logger.info("Startup admin seed complete")
    except Exception as e:
        logger.error(f"Startup admin seed failed (will retry lazily on login): {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
