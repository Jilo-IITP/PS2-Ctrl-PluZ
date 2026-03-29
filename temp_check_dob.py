from core.supabase import get_supabase
import asyncio
import uuid

async def check():
    supabase = get_supabase()
    # Let's get a valid TPA ID from existing users to avoid fkey failure
    users_res = supabase.table("users").select("id").limit(1).execute()
    if not users_res.data:
        print("No users found to test with.")
        return
    
    tpa_id = users_res.data[0]["id"]
    try:
        # Test empty string for dob
        res = supabase.table("patients").insert({"name": "Test Dob", "tpa_id": tpa_id, "dob": ""}).execute()
        print(f"Insert with empty dob succeeded: {res.data}")
    except Exception as e:
        print(f"Insert with empty dob failed: {e}")

asyncio.run(check())
