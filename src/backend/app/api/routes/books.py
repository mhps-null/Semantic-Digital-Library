from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional
from pathlib import Path

from app.utils.database import get_all_books, get_book_by_id
from app.schemas.book import BookListResponse, BookDetailResponse
from app.utils.lsa_engine import lsa_engine

router = APIRouter()

@router.get("", response_model=BookListResponse)
def list_books(
    request: Request,
    q: Optional[str] = Query(None),
    page: int = 1,
    per_page: int = 12,
):
    books = get_all_books(load_text=False)
    
    if q:
        books = [b for b in books if q.lower() in (b.title or "").lower()]

    total = len(books)
    start = (page - 1) * per_page
    end = start + per_page
    page_items = books[start:end]

    results = []
    base_url = str(request.base_url).rstrip("/")

    for b in page_items:
        cover_name = Path(b.cover_path).name if b.cover_path else ""
        cover_url = f"{base_url}/covers/{cover_name}" if cover_name else ""
        
        results.append({
            "id": b.id, 
            "title": b.title, 
            "cover_url": cover_url
        })

    return {
        "results": results,
        "total": total,
        "page": page,
        "per_page": per_page 
    }

@router.get("/{book_id}", response_model=BookDetailResponse)
def get_book(book_id: str, request: Request):
    b = get_book_by_id(book_id, load_text=True)
    if not b:
        raise HTTPException(status_code=404, detail="Book not found")

    base_url = str(request.base_url).rstrip("/")
    cover_name = Path(b.cover_path).name if b.cover_path else ""
    isi_buku = b.text if b.text else "Teks tidak tersedia."

    rekomendasi_raw = lsa_engine.get_recommendations(book_id)
    rekomendasi_list = []
    
    for item in rekomendasi_raw:
        rec_book = get_book_by_id(item["id"], load_text=False)
        if rec_book:
            rec_cover = Path(rec_book.cover_path).name if rec_book.cover_path else ""
            rec_url = f"{base_url}/covers/{rec_cover}" if rec_cover else ""
            
            rekomendasi_list.append({
                "id": rec_book.id,
                "title": rec_book.title,
                "cover_url": rec_url,
                "similarity_score": round(item['score'], 4)
            })

    return {
        "id": b.id,
        "title": b.title,
        "cover_url": f"{base_url}/covers/{cover_name}" if cover_name else "",
        "read_url": f"{base_url}/txt/{b.id}.txt",
        "text_content": isi_buku[:1000] + "...", 
        "recommendations": rekomendasi_list
    }