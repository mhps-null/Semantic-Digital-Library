import os
from dotenv import load_dotenv

load_dotenv()

API_V1_PREFIX = "/api"
PROJECT_NAME = "E-Tanol Backend"
VERSION = "1.0.0"

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://algeo2.neutroncodes.com",
    "https://www.algeo2.neutroncodes.com",
    "http://localhost:5005"
]