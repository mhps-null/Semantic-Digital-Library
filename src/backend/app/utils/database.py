from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

from ..models.book import Book

def find_data_dir() -> Path:
	here = Path(__file__).resolve()
	for parent in here.parents:
		candidate = parent / "data"
		if candidate.exists() and candidate.is_dir():
			return candidate
	raise FileNotFoundError("Could not find `data/` directory in any parent of the project")

@lru_cache(maxsize=1)
def load_mapper() -> Dict[str, Dict]:
	data_dir = find_data_dir()
	mapper_path = data_dir / "mapper.json"
	if not mapper_path.exists():
		raise FileNotFoundError(f"mapper.json not found at expected location: {mapper_path}")
	with mapper_path.open("r", encoding="utf-8") as fh:
		return json.load(fh)

def _abs_path_from_data(rel_path: str) -> Path:
	data_dir = find_data_dir()
	return (data_dir / rel_path).resolve()

def get_all_books(load_text: bool = False) -> List[Book]:
	mapper = load_mapper()
	books: List[Book] = []
	for id_, meta in mapper.items():
		title = meta.get("title", "")
		cover_rel = meta.get("cover", "")
		txt_rel = meta.get("txt", "")

		cover_path = str(_abs_path_from_data(cover_rel)) if cover_rel else ""
		text_path = str(_abs_path_from_data(txt_rel)) if txt_rel else ""

		book = Book(id=str(id_), title=title, cover_path=cover_path, text_path=text_path)
		if load_text and text_path:
			try:
				book.text = Path(book.text_path).read_text(encoding="utf-8", errors="ignore")
			except Exception:
				book.text = None
		books.append(book)
	return books

def get_book_by_id(book_id: str, load_text: bool = False) -> Optional[Book]:
	mapper = load_mapper()
	entry = mapper.get(str(book_id))
	if not entry:
		return None
	cover_path = str(_abs_path_from_data(entry.get("cover", ""))) if entry.get("cover") else ""
	text_path = str(_abs_path_from_data(entry.get("txt", ""))) if entry.get("txt") else ""
	book = Book(id=str(book_id), title=entry.get("title", ""), cover_path=cover_path, text_path=text_path)
	if load_text and book.text_path:
		try:
			book.text = Path(book.text_path).read_text(encoding="utf-8", errors="ignore")
		except Exception:
			book.text = None
	return book

def iter_book_texts() -> Dict[str, str]:
	result: Dict[str, str] = {}
	mapper = load_mapper()
	for id_, meta in mapper.items():
		txt_rel = meta.get("txt")
		if not txt_rel:
			continue
		p = _abs_path_from_data(txt_rel)
		if p.exists():
			try:
				result[id_] = p.read_text(encoding="utf-8", errors="ignore")
			except Exception:
				result[id_] = ""
	return result