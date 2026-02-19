from pydantic import BaseModel

class SearchResult(BaseModel):
    id: str
    title: str
    cover_url: str
    similarity_score: float