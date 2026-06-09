from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import records, friends, store, auth
from app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 初始化資料庫與大量測試資料
    init_db()
    yield

app = FastAPI(
    title="Puzzle World API", 
    description="Gamified Finance Tracking",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(records.router, prefix="/api", tags=["Records"])
app.include_router(friends.router, prefix="/api", tags=["Friends"])
app.include_router(store.router, prefix="/api", tags=["Store"])
app.include_router(auth.router, prefix="/api", tags=["Auth"])

@app.get("/")
def root():
    return {"message": "Welcome to Puzzle World API!"}
