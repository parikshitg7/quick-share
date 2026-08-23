from fastapi import APIRouter
from app.database import supabase
from app.services.storage import upload_test_object, download_test_object

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
        err_str = str(e)
        if "PGRST" in err_str or "205" in err_str or "status_code" in dir(e):
            return {"database": "connected"}
        return {"database": "error", "detail": err_str}

@router.get("/health/storage")
def health_storage_check():
    try:
        test_content = "healthcheck-ok"
        upload_test_object(content=test_content)
        read_back = download_test_object()
        if read_back == test_content:
            return {"storage": "connected"}
        return {"storage": "error", "detail": "Content mismatch"}
    except Exception as e:
        return {"storage": "error", "detail": str(e)}