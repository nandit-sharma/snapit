from fastapi import FastAPI
from app.database.database import supabase
from app.api.routes.complaints import router as complaints_router
from app.api.routes.admin import router as admin_router
from app.api.routes.users import router as users_router


app = FastAPI(title="Smart Campus API")
app.include_router(complaints_router)
app.include_router(admin_router)
app.include_router(users_router)

@app.get("/")
def root():
    return {"message": "Smart Campus API is running"}


@app.get("/test-db")
def test_database():
    response = supabase.table("departments").select("*").execute()

    return {
        "connected": True,
        "departments": response.data
    }
