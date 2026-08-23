from fastapi import APIRouter
from app.database import supabase

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/health/db")
def health_db_check():
    try:
        # Perform a harmless PostgREST root call to verify active connectivity
        response = supabase.postgrest.from_("").select("*").execute()
        return {"database": "connected"}
    except Exception as e:
        # If the client reached Supabase and received an API response/exception, connection is verified
        err_str = str(e)
        if "PGRST" in err_str or "205" in err_str or "status_code" in dir(e):
            return {"database": "connected"}
        return {"database": "error", "detail": err_str}