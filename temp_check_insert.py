from core.supabase import get_supabase
import asyncio
import uuid

async def check():
    supabase = get_supabase()
    # Generate a random UUID for tpa_id to avoid constraint issues if it exists
    # Or just use a dummy one if we are just testing return value
    # But wait, we need a valid user ID if it's a foreign key.
    # Let's just try to insert a patient with a random UUID for tpa_id and see what happens.
    dummy_tpa = str(uuid.uuid4())
    try:
        res = supabase.table("patients").insert({"name": "Test Return", "tpa_id": dummy_tpa}).execute()
        print(f"Data: {res.data}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(check())
