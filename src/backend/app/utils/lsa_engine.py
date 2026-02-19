import re
import numpy as np
from collections import Counter
from pathlib import Path
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import os
import pickle

from app.utils.database import get_all_books
from app.utils.my_math import get_eigen_components, cosine_similarity, get_svd_components

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class LSAEngine:
    def __init__(self):
        base_stopwords = set(stopwords.words('english'))
        library_stopwords = {
            "book", "novel", "series", "story", "written", "author", "published",
            "edition", "volume", "chapter", "part", "synopsis", "plot",
            "character", "reader", "reading", "best", "selling", "new", "york",
            "times", "bestseller", "paperback", "hardcover"
        }
        
        extra_stopwords = {
            "gutenberg", "project", "chapter", "volume", "edition", "page",
            "title", "author", "contents", "preface", "introduction",
            "digitized", "archive", "public", "domain", "distributed",
            "illustration", "plate", "figure", "text", "work", "works"
        }
        
        old_english_stopwords = {
            "hath", "doth", "thou", "thee", "thy", "thine", "tis", "twas",
            "shalt", "wilt", "art", "ye", "hast", "canst", "dost", 
            "wherefore", "herein", "therein", "upon", "unto", "whilst"
        }
        
        self.stopwords = base_stopwords.union(library_stopwords).union(extra_stopwords).union(old_english_stopwords)
        
        self.stemmer = PorterStemmer()

        self.vocab: dict[str, int] = {}
        self.doc_vectors: np.ndarray | None = None
        self.term_vectors: np.ndarray | None = None
        self.sigma_inv: np.ndarray | None = None 
        
        self.book_ids: list[int] = []
        self.is_ready: bool = False

        self.top_n_words = 15000 
        self.CACHE_FILE = "lsa_cache.pkl"

        self.idf: np.ndarray | None = None
    
    def preprocess(self, text: str) -> list[str]:
        if not text:
            return []

        text = text.lower()
        
        patterns = [
            r'project gutenberg', r'gutenberg literary archive', 
            r'electronic works', r'foundation',
            r'license', r'copyright', r'transcribed by'
        ]
        for p in patterns:
            text = re.sub(p, '', text)

        text = re.sub(r'[^a-z\s]', '', text)
        words = text.split()

        processed_tokens = []
        for w in words:
            if w not in self.stopwords and len(w) > 2:
                stemmed = self.stemmer.stem(w)
                if len(stemmed) > 2:
                    processed_tokens.append(stemmed)

        return processed_tokens

    def train(self):
        if os.path.exists(self.CACHE_FILE):
            print(f"Loading data LSA dari {self.CACHE_FILE} (Skip Training)...")
            try:
                with open(self.CACHE_FILE, 'rb') as f:
                    data = pickle.load(f)
                    self.vocab = data['vocab']
                    self.doc_vectors = data['doc_vectors']
                    self.term_vectors = data.get('term_vectors')
                    self.sigma_inv = data.get('sigma_inv') 
                    self.book_ids = data['book_ids']
                    self.idf = data.get('idf', None)

                if self.idf is None or self.term_vectors is None:
                    print("Cache tidak lengkap (versi lama). Melakukan training ulang...")
                else:
                    self.is_ready = True
                    print("LSA Siap! (Loaded from Cache)")
                    return
            except Exception as e:
                print(f"Gagal load cache: {e}, mengulang training...")

        print("Memulai pelatihan LSA dari awal...")
        try:
            books = get_all_books(load_text=True)
            valid_books = [b for b in books if b.text]

            if not valid_books:
                print("Tidak ada teks buku.")
                return

            self.book_ids = [b.id for b in valid_books]
            total_books = len(valid_books)

            print(f"   -> Menghitung statistik kata untuk {total_books} buku...")
            all_tokens_list: list[list[str]] = []
            word_counts = Counter()

            for i, b in enumerate(valid_books):
                tokens = self.preprocess(b.text)
                all_tokens_list.append(tokens)
                word_counts.update(tokens)

                if (i + 1) % 50 == 0:
                    print(f"      ... Memproses buku {i + 1}/{total_books}")

            # Ambil top N words
            most_common = word_counts.most_common(self.top_n_words)
            sorted_vocab = sorted([word for word, count in most_common])
            self.vocab = {word: idx for idx, word in enumerate(sorted_vocab)}

            n_vocab = len(self.vocab)
            n_docs = len(valid_books)

            print(f"   -> Optimasi: Menggunakan {n_vocab} kata terpopuler.")
            print(f"   -> Membuat matriks Count ({n_docs} x {n_vocab})...")

            # Matriks A (Docs x Terms)
            A = np.zeros((n_docs, n_vocab), dtype=float)
            for i, tokens in enumerate(all_tokens_list):
                for word in tokens:
                    if word in self.vocab:
                        col_idx = self.vocab[word]
                        A[i, col_idx] += 1.0
            
            doc_freq = np.sum(A > 0, axis=0)
            
            max_doc_threshold = n_docs * 0.60 
            
            too_common_indices = np.where(doc_freq > max_doc_threshold)[0]
            
            if len(too_common_indices) > 0:
                print(f"   -> Optimasi: Membuang {len(too_common_indices)} kata yang terlalu umum (muncul di >60% buku).")
                A[:, too_common_indices] = 0

            print("   -> Menghitung Matriks TF-IDF...")

            A_td = A.T 
            n = n_docs

            # TF
            doc_length_td = np.sum(A_td, axis=0, keepdims=True)
            doc_length_td[doc_length_td == 0] = 1
            TF_td = A_td / doc_length_td

            # IDF
            df_i_td = np.sum(A_td > 0, axis=1)
            IDF_td = np.log10(n / (1 + df_i_td))
            self.idf = IDF_td

            TF_IDF_matrix = (IDF_td[:, np.newaxis]) * TF_td

            A_input_for_svd = TF_IDF_matrix

            print("   -> Menghitung SVD Manual...")
            # V_k (Docs x k), Sigma_k (k x k)
            V_k, sigma_k = get_svd_components(A_input_for_svd, n_components=25)


            # U = A * V * S^-1
            
            # 1. Hitung Invers Sigma (S^-1)
            s_diag = np.diag(sigma_k)
            s_inv_diag = np.where(s_diag > 1e-10, 1.0 / s_diag, 0)
            self.sigma_inv = np.diag(s_inv_diag)

            # 2. Hitung U_k = A_input @ V_k @ Sigma^-1
            self.term_vectors = (A_input_for_svd @ V_k) @ self.sigma_inv

            # 3. Hitung Document Vectors (V_k @ sigma_k)
            self.doc_vectors = V_k @ sigma_k

            norms = np.sqrt(np.sum(self.doc_vectors ** 2, axis=1, keepdims=True))
            norms[norms == 0] = 1
            self.doc_vectors = self.doc_vectors / norms

            self.is_ready = True

            try:
                with open(self.CACHE_FILE, 'wb') as f:
                    pickle.dump({
                        'vocab': self.vocab,
                        'doc_vectors': self.doc_vectors,
                        'term_vectors': self.term_vectors,
                        'sigma_inv': self.sigma_inv,
                        'book_ids': self.book_ids,
                        'idf': self.idf
                    }, f)
                print(f"Hasil training disimpan ke {self.CACHE_FILE}")
            except Exception as e:
                print(f"Gagal menyimpan cache: {e}")

        except Exception as e:
            print(f"Error Training LSA: {e}")
            import traceback
            traceback.print_exc()

    def _build_query_vector(self, text: str) -> np.ndarray | None:
        """Membuat vektor query TF-IDF (dimensi Vocab)"""
        if self.idf is None or self.vocab is None:
            return None

        tokens = self.preprocess(text)
        if not tokens:
            return None

        n_vocab = len(self.vocab)
        counts = np.zeros(n_vocab, dtype=float)
        
        # Hitung frekuensi kata query
        has_word = False
        for w in tokens:
            idx = self.vocab.get(w)
            if idx is not None:
                counts[idx] += 1.0
                has_word = True
        
        if not has_word:
            return None

        # Hitung TF-IDF Query
        total = counts.sum()
        tf = counts / total
        tfidf_q = tf * self.idf

        return tfidf_q

    def search(self, query_text: str, threshold: float = 0.1, top_k: int | None = None):
        """
        Pencarian LSA:
        1. Buat vektor Query (TF-IDF)
        2. Proyeksikan Query ke Ruang Laten (menggunakan U_k)
        3. Bandingkan dengan Dokumen di Ruang Laten (Cosine Similarity)
        """
        if not self.is_ready or self.term_vectors is None:
            print("LSAEngine belum siap.")
            return []

        query_vec_tfidf = self._build_query_vector(query_text)
        
        if query_vec_tfidf is None:
            print("Query tidak mengandung kata yang ada di vocabulary.")
            return []

        query_vec_latent = query_vec_tfidf @ self.term_vectors

        results = []
        for i, doc_vec_latent in enumerate(self.doc_vectors):
            sim = cosine_similarity(query_vec_latent, doc_vec_latent)
            if sim >= threshold:
                results.append({
                    "id": self.book_ids[i],
                    "score": float(sim),
                })

        results.sort(key=lambda x: x["score"], reverse=True)

        if top_k is not None and top_k > 0:
            results = results[:top_k]

        return results
    
    def get_recommendations(self, book_id, top_k=5):
        if not self.is_ready or book_id not in self.book_ids or self.doc_vectors is None:
            return []
        try:
            target_idx = self.book_ids.index(book_id)
            target_vec = self.doc_vectors[target_idx]
            scores = []
            for i, vec in enumerate(self.doc_vectors):
                if i == target_idx:
                    continue
                sim = cosine_similarity(target_vec, vec)
                scores.append({"id": self.book_ids[i], "score": sim})
            scores.sort(key=lambda x: x["score"], reverse=True)
            return scores[:top_k]
        except Exception as e:
            print(f"Error Recommend: {e}")
            return []

lsa_engine = LSAEngine()