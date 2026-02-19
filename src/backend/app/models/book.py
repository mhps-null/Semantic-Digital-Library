from dataclasses import dataclass
from typing import Optional
from pathlib import Path

@dataclass
class Book:
    id: str
    title: str
    cover_path: str
    text_path: str
    text: Optional[str] = None

    def load_text(self) -> Optional[str]:
        if self.text is None:
            try:
                p = Path(self.text_path)
                if p.exists():
                    self.text = p.read_text(encoding="utf-8", errors="ignore")
                else:
                    self.text = None
            except Exception:
                self.text = None
        return self.text