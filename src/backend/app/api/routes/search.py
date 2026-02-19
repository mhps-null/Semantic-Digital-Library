from fastapi import APIRouter, UploadFile, File, Query, HTTPException
from typing import List
from pathlib import Path
from pydantic import BaseModel

from app.utils.database import get_book_by_id
from app.utils.ml_engine import search_engine
from app.schemas.search import SearchResult
from app.utils.lsa_engine import lsa_engine

router = APIRouter()

@router.post("/image", response_model=List[SearchResult])
async def search_by_image(
    file: UploadFile = File(...),
    threshold: float = Query(0.3)
):
    content = await file.read()
    
    similar_books = search_engine.search(content, threshold=threshold)
    
    if not similar_books:
        return []

    results = []
    for item in similar_books:
        book = get_book_by_id(item["id"])
        if book:
            cover_name = Path(book.cover_path).name if book.cover_path else ""
            cover_url = f"/covers/{cover_name}" if cover_name else ""

            results.append({
                "id": book.id,
                "title": book.title,
                "cover_url": cover_url,
                "similarity_score": round(item["score"], 2)
            })
            
    return results

@router.post("/document", response_model=List[SearchResult])
async def search_by_document(
    file: UploadFile = File(...),
    threshold: float = Query(
        0.1,
        description="Batas minimum kemiripan (Cosine Similarity). Nilai lebih besar = lebih mirip."
    )
):
    if not file.filename.lower().endswith(".txt"):
        raise HTTPException(
            status_code=400,
            detail="Hanya file .txt yang diperbolehkan untuk pencarian dokumen."
        )

    content_bytes = await file.read()

    try:
        query_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File teks rusak atau encoding bukan UTF-8."
        )

    if not query_text.strip():
        raise HTTPException(status_code=400, detail="File teks kosong.")

    if not lsa_engine.is_ready:
        raise HTTPException(
            status_code=500,
            detail="Mesin LSA belum siap. Pastikan training selesai."
        )

    similar_docs = lsa_engine.search(query_text, threshold=threshold)

    if not similar_docs:
        return []

    results = []
    for item in similar_docs:
        book = get_book_by_id(item["id"])
        if not book:
            continue

        cover_name = Path(book.cover_path).name if book.cover_path else ""
        cover_url = f"/covers/{cover_name}" if cover_name else None

        results.append({
            "id": book.id,
            "title": book.title,
            "cover_url": cover_url,
            "similarity_score": round(item["score"], 2)
        })

    return results