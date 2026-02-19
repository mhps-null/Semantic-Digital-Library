import numpy as np

def get_mean_vector(matrix):
    return np.mean(matrix, axis=0)

def center_data(matrix, mean_vector):
    return matrix - mean_vector

def compute_covariance_matrix(matrix):
    n_samples = matrix.shape[0]
    cov_matrix = (matrix.T @ matrix) / (n_samples - 1)
    return cov_matrix

def power_iteration(A, num_simulations=100):
    n, _ = A.shape
    b_k = np.random.rand(n)
    
    for _ in range(num_simulations):
        b_k1 = np.dot(A, b_k)
        
        b_k1_norm = np.sqrt(np.sum(b_k1**2))
        
        b_k = b_k1 / b_k1_norm

    eigenvalue = np.dot(b_k.T, np.dot(A, b_k)) / np.dot(b_k.T, b_k)
    
    return eigenvalue, b_k

def get_eigen_components(cov_matrix, n_components=10):
    A = cov_matrix.copy()
    eigenvalues = []
    eigenvectors = []
    
    for _ in range(n_components):
        eig_val, eig_vec = power_iteration(A)
        
        eigenvalues.append(eig_val)
        eigenvectors.append(eig_vec)
        
        A = A - (eig_val * np.outer(eig_vec, eig_vec))
        
    return np.array(eigenvalues), np.array(eigenvectors).T

def euclidean_distance(v1, v2):
    return np.sqrt(np.sum((v1 - v2)**2))

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_v1 = np.sqrt(np.sum(v1**2))
    norm_v2 = np.sqrt(np.sum(v2**2))
    
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
        
    return dot_product / (norm_v1 * norm_v2)

def cosine_distance(v1, v2):
    """
    Menghitung 1 - Cosine Similarity.
    Hasil 0 berarti identik, mendekati 1 (atau 2) berarti berbeda.
    """
    dot_product = np.dot(v1, v2)
    norm_v1 = np.sqrt(np.sum(v1 * v1))
    norm_v2 = np.sqrt(np.sum(v2 * v2))
    
    if norm_v1 == 0 or norm_v2 == 0:
        return 1.0
        
    similarity = dot_product / (norm_v1 * norm_v2)
    
    return 1.0 - similarity

def get_svd_components(A, n_components = 10):
    ATA = A.T @ A
    eigenvalue_ATA, V_full = get_eigen_components(ATA)
    n_components = min(n_components, V_full.shape[1])
    V_k = V_full[:, :n_components]
    singular_values_k = np.sqrt(eigenvalue_ATA[:n_components])
    sigma_k = np.diag(singular_values_k)
    return V_k, sigma_k