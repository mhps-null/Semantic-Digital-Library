from pydantic import BaseModel
from typing import List, Optional

class BookItem(BaseModel):
    id: str
    title: str
    cover_url: str

class RecommendationItem(BookItem):
    similarity_score: Optional[float] = None 

class BookListResponse(BaseModel):
    results: List[BookItem]
    total: int
    page: int
    per_page: int

class BookDetailResponse(BaseModel):
    id: str
    title: str
    cover_url: str
    read_url: str = ""
    text_content: str = ""
    recommendations: List[RecommendationItem] = []