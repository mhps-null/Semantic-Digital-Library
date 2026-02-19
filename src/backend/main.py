from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from pathlib import Path

from app.core.config import CORS_ORIGINS, PROJECT_NAME, VERSION, API_V1_PREFIX
from app.api.routes import books, search
from app.utils.database import find_data_dir
from app.utils.ml_engine import search_engine 
from app.utils.lsa_engine import lsa_engine

app = FastAPI(
    title=PROJECT_NAME,
    description="E-Tanol Backend",
    version=VERSION,

)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("Server starting up...")
    search_engine.train()
    lsa_engine.train() 
    print("Server siap melayani!")

@app.get("/")
async def root():
    return {"message": "E-Tanol Backend is Running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

try:
    data_dir = find_data_dir()

    covers_dir = data_dir / "covers"
    if covers_dir.exists():
        app.mount("/covers", StaticFiles(directory=str(covers_dir)), name="covers")
        print(f"Sukses load covers dari: {covers_dir}")
    else:
        print(f"Folder covers tidak ditemukan di: {covers_dir}")

    txt_dir = data_dir / "txt"
    if txt_dir.exists():
        app.mount("/txt", StaticFiles(directory=str(txt_dir)), name="txt")
        print(f"Sukses load txt dari: {txt_dir}")
    else:
        print(f"Folder txt tidak ditemukan di: {txt_dir}")

except Exception as e:
    print(f"Gagal load static files: {e}")

app.include_router(books.router, prefix=f"{API_V1_PREFIX}/books", tags=["Books"])
app.include_router(search.router, prefix=f"{API_V1_PREFIX}/search",tags=["Search"])