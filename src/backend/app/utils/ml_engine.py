import numpy as np
from PIL import Image, ImageOps, ImageFilter
from io import BytesIO
from pathlib import Path
from app.utils.database import find_data_dir

from app.utils.my_math import get_mean_vector, center_data, get_eigen_components, cosine_distance

IMG_SIZE = (64, 64) 
N_COMPONENTS = 30

class ImageSearchEngine:
    def __init__(self):
        self.ids = []
        self.projected_data = []
        self.mean_vec = None
        self.eigen_vectors = None
        self.is_ready = False

    def _load_image_spec(self, source, size):
        if isinstance(source, bytes):
            img = Image.open(BytesIO(source)).convert("RGB")
        else:
            img = Image.open(source).convert("RGB")
        
        img = img.resize(size)

        img_gray = img.convert("L")

        # Histogram Equalization
        # Ini akan memaksa gambar yang "pucat/berkabut" jadi kontras tinggi.
        img_eq = ImageOps.equalize(img_gray)
        
        # Gaussian Blur
        # Gunanya menghapus bintik-bintik noise
        # Radius 1 atau 2 biasanya cukup untuk ukuran 64x64
        img_smooth = img_eq.filter(ImageFilter.GaussianBlur(radius=1))
        
        arr = np.array(img_smooth)
        return arr.flatten()

    def train(self):
        print("Memulai pelatihan Image Search Engine ...")
        try:
            data_dir = find_data_dir()
            covers_dir = data_dir / "covers"
            
            image_matrix = []
            valid_ids = []
            
            files = list(covers_dir.glob("*.jpg"))
            if not files:
                print("Tidak ada gambar.")
                return

            print(f"   -> Memproses {len(files)} gambar (Metode Snapshot)...")

            for file_path in files:
                try:
                    img_vec = self._load_image_spec(file_path, IMG_SIZE)
                    image_matrix.append(img_vec)
                    valid_ids.append(file_path.stem)
                except Exception:
                    pass

            X = np.array(image_matrix)
            n_samples = X.shape[0]

            print("   -> Menghitung Mean & Centering...")
            self.mean_vec = get_mean_vector(X)
            X_centered = center_data(X, self.mean_vec)

            print(f"   -> Menghitung Matriks Gram ({n_samples}x{n_samples})...")
            L = np.dot(X_centered, X_centered.T) / n_samples
            
            print("   -> Power Iteration (Eigen)...")
            _, v_small = get_eigen_components(L, n_components=N_COMPONENTS)

            if v_small.shape[0] == N_COMPONENTS: 
                v_small = v_small.T

            print("   -> Rekonstruksi Eigenfaces...")
            self.eigen_vectors = np.dot(X_centered.T, v_small)

            # Normalisasi Vektor Eigen
            norms = np.sqrt(np.sum(self.eigen_vectors**2, axis=0))
            norms[norms == 0] = 1
            self.eigen_vectors = self.eigen_vectors / norms

            print("   -> Proyeksi Database...")
            self.projected_data = np.dot(X_centered, self.eigen_vectors)
            
            self.ids = valid_ids
            self.is_ready = True
            print(f"Pelatihan Selesai! Menggunakan {N_COMPONENTS} komponen utama.")

        except Exception as e:
            print(f"Error Training: {e}")

    def search(self, image_file: bytes, threshold: float = 0.5):
        if not self.is_ready:
            print("Engine belum siap. Lakukan train() dulu.")
            return []

        try:
            img_vec = self._load_image_spec(image_file, IMG_SIZE)
            
            img_centered = img_vec - self.mean_vec
            
            query_projected = np.dot(img_centered, self.eigen_vectors)

            results = []
            for i, db_vec in enumerate(self.projected_data):
                dist = cosine_distance(query_projected, db_vec)
                
                if threshold is None or dist < threshold:
                    results.append({
                        "id": self.ids[i], 
                        "score": float(dist)
                    })
            
            results.sort(key=lambda x: x["score"])
            return results

        except Exception as e:
            print(f"Error Searching: {e}")
            return []

search_engine = ImageSearchEngine()