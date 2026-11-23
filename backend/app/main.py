from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import supabase
from app.api.routes.complaints import router as complaints_router
from app.api.routes.admin import router as admin_router
from app.api.routes.users import router as users_router
from app.api.routes.auth import router as auth_router

app = FastAPI(title="Smart Campus API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(complaints_router)
app.include_router(admin_router)
app.include_router(users_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "Smart Campus API is running"}


@app.get("/departments")
def get_departments():
    response = supabase.table("departments").select("*").execute()
    return {"departments": response.data or []}


@app.get("/test-db")
def test_database():
    response = supabase.table("departments").select("*").execute()

    return {
        "connected": True,
        "departments": response.data
    }
