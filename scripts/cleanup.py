import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path('/app/backend/.env'))

async def main():
    c = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = c[os.environ['DB_NAME']]
    b = await db.bookings.delete_many({})
    s = await db.slots.delete_many({})
    print("deleted bookings:", b.deleted_count, "slots:", s.deleted_count)
    c.close()

asyncio.run(main())
