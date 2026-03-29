from core.supabase import get_supabase
import asyncio

async def check():
    supabase = get_supabase()
    # We can't easily get the column types via the client, but we can try an insert and see the error.
    try:
        res = supabase.table("patients").insert({"name": "Test", "tpa_id": "invalid-uuid"}).execute()
        print("Insert successful (unexpected)")
    except Exception as e:
        print(f"Insert failed as expected: {e}")

asyncio.run(check())
