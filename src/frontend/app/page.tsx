"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  LinearProgress,
} from "@mui/material";
import DarkModeToggle from "./components/DarkModeToggle";
import BookList from "./components/BookList";
import BookPagination from "./components/BookPagination";
import SearchBar from "./components/SearchBar";
import { Book } from "./types/book";

const ITEMS_PER_PAGE = 15;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface HomePersistedState {
  page: number;
  searchQuery: string;
  selectedImage: File | null;
  selectedDocument: File | null;
  books: Book[];
  total: number;
  scrollY: number;
  imageThreshold: number;
  documentThreshold: number;
}

let lastHomeState: HomePersistedState | null = null;

export default function Home() {
  const router = useRouter();
  const [page, setPage] = useState(lastHomeState?.page ?? 1);
  const [searchQuery, setSearchQuery] = useState(
    lastHomeState?.searchQuery ?? ""
  );
  const [debouncedSuggestQuery, setDebouncedSuggestQuery] = useState(
    lastHomeState?.searchQuery ?? ""
  );
  const [executedQuery, setExecutedQuery] = useState(
    lastHomeState?.searchQuery ?? ""
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(
    lastHomeState?.selectedImage ?? null
  );
  const [selectedDocument, setSelectedDocument] = useState<File | null>(
    lastHomeState?.selectedDocument ?? null
  );
  const [books, setBooks] = useState<Book[]>(lastHomeState?.books ?? []);
  const [total, setTotal] = useState(lastHomeState?.total ?? 0);
  const [imageThreshold, setImageThreshold] = useState(
    lastHomeState?.imageThreshold ?? 0.3
  );
  const [documentThreshold, setDocumentThreshold] = useState(
    lastHomeState?.documentThreshold ?? 0.1
  );
  const imageThresholdRef = useRef(imageThreshold);
  const documentThresholdRef = useRef(documentThreshold);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionBooks, setSuggestionBooks] = useState<Book[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && lastHomeState?.scrollY != null) {
      window.scrollTo(0, lastHomeState.scrollY);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (selectedDocument) {
          const formData = new FormData();
          formData.append("file", selectedDocument);

          const params = new URLSearchParams({
            threshold: String(documentThresholdRef.current),
          });

          const response = await fetch(
            `${API_BASE_URL}/api/search/document?${params.toString()}`,
            {
              method: "POST",
              body: formData,
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch document search results");
          }

          const data: {
            id: string;
            title: string;
            cover_url: string;
            similarity_score: number;
          }[] = await response.json();

          const mapped: Book[] = data.map((item) => ({
            id: item.id,
            title: item.title,
            coverImage: item.cover_url.startsWith("http")
              ? item.cover_url
              : `${API_BASE_URL}${item.cover_url}`,
            similarityScore: item.similarity_score,
          }));

          setBooks(mapped);
          setTotal(mapped.length);
        } else if (selectedImage) {
          const formData = new FormData();
          formData.append("file", selectedImage);

          const params = new URLSearchParams({
            threshold: String(imageThresholdRef.current),
          });

          const response = await fetch(
            `${API_BASE_URL}/api/search/image?${params.toString()}`,
            {
              method: "POST",
              body: formData,
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch image search results");
          }

          const data: {
            id: string;
            title: string;
            cover_url: string;
            similarity_score: number;
          }[] = await response.json();

          const mapped: Book[] = data.map((item) => ({
            id: item.id,
            title: item.title,
            coverImage: `${API_BASE_URL}${item.cover_url}`,
            similarityScore: item.similarity_score,
          }));

          setBooks(mapped);
          setTotal(mapped.length);
        } else {
          const params = new URLSearchParams({
            page: String(page),
            per_page: String(ITEMS_PER_PAGE),
            q: executedQuery.trim() || "",
          });

          const response = await fetch(
            `${API_BASE_URL}/api/books?${params.toString()}`,
            { signal: controller.signal }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch books");
          }

          const data: {
            results: { id: string; title: string; cover_url: string }[];
            total: number;
            page: number;
            per_page: number;
          } = await response.json();

          const mapped: Book[] = data.results.map((item) => ({
            id: item.id,
            title: item.title,
            coverImage: item.cover_url,
          }));

          setBooks(mapped);
          setTotal(data.total);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error(err);
        setError(
          "Gagal mengambil data dari server. Pastikan backend berjalan."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [page, executedQuery, selectedImage, selectedDocument]);

  useEffect(() => {
    if (selectedImage || selectedDocument) return;
    const handler = setTimeout(() => {
      setDebouncedSuggestQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedImage, selectedDocument]);

  useEffect(() => {
    if (selectedImage || selectedDocument) return;
    const q = debouncedSuggestQuery.trim();
    if (!q) {
      setSuggestionBooks([]);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const params = new URLSearchParams({
          page: "1",
          per_page: "8",
          q,
        });
        const response = await fetch(
          `${API_BASE_URL}/api/books?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          setLoadingSuggestions(false);
          return;
        }

        const data: {
          results: { id: string; title: string; cover_url: string }[];
          total: number;
          page: number;
          per_page: number;
        } = await response.json();

        const titlesSeen = new Set<string>();
        const uniqueBooks: Book[] = [];
        for (const item of data.results) {
          if (!titlesSeen.has(item.title)) {
            titlesSeen.add(item.title);
            uniqueBooks.push({
              id: item.id,
              title: item.title,
              coverImage: item.cover_url,
            });
          }
          if (uniqueBooks.length >= 8) break;
        }
        setSuggestionBooks(uniqueBooks);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error(err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();

    return () => {
      controller.abort();
    };
  }, [debouncedSuggestQuery, selectedImage, selectedDocument]);

  useEffect(() => {
    imageThresholdRef.current = imageThreshold;
  }, [imageThreshold]);

  useEffect(() => {
    documentThresholdRef.current = documentThreshold;
  }, [documentThreshold]);

  const handleImageSelect = (imageFile: File | null) => {
    setSelectedImage(imageFile);
    if (imageFile) {
      setSearchQuery("");
      setExecutedQuery("");
      setPage(1);
      setSuggestionBooks([]);
      setSelectedDocument(null);
    }
  };

  const handleDocumentSelect = (documentFile: File | null) => {
    setSelectedDocument(documentFile);
    if (documentFile) {
      setSearchQuery("");
      setExecutedQuery("");
      setPage(1);
      setSuggestionBooks([]);
      setSelectedImage(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSubmitSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    setExecutedQuery(trimmed);
    setPage(1);
    if (selectedImage) {
      setSelectedImage(null);
    }
    if (selectedDocument) {
      setSelectedDocument(null);
    }
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setExecutedQuery("");
    setSelectedImage(null);
    setSelectedDocument(null);
    setPage(1);
    setSuggestionBooks([]);
  };
  const totalPages =
    !selectedImage && !selectedDocument && total > 0
      ? Math.ceil(total / ITEMS_PER_PAGE)
      : 1;

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        lastHomeState = {
          page,
          searchQuery,
          selectedImage,
          selectedDocument,
          books,
          total,
          scrollY: window.scrollY,
          imageThreshold,
          documentThreshold,
        };
      }
    };
  }, [
    page,
    searchQuery,
    selectedImage,
    selectedDocument,
    books,
    total,
    imageThreshold,
    documentThreshold,
  ]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
        backgroundImage: (theme) =>
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(147,51,234,0.16), transparent 55%)"
            : "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 55%), radial-gradient(circle at bottom right, rgba(236,72,153,0.10), transparent 55%)",
        backgroundAttachment: "fixed",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(30, 30, 30, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid",
          borderColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.08)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 1px 3px rgba(0, 0, 0, 0.3)"
              : "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.5,
            gap: 2,
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.1rem", sm: "1.35rem" },
              color: "text.primary",
              letterSpacing: "0.3px",
              minWidth: { xs: "100%", md: "auto" },
              mb: { xs: 1, md: 0 },
            }}
          >
            E-Tanol Library
          </Typography>
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "flex-start",
              minWidth: { xs: "100%", md: 0 },
              maxWidth: { xs: "100%", md: "none" },
              mx: { xs: 0, md: 2 },
            }}
          >
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              onSubmit={handleSubmitSearch}
              onImageSelect={handleImageSelect}
              selectedImageFile={selectedImage}
              imageThreshold={imageThreshold}
              onImageThresholdChange={setImageThreshold}
              onDocumentSelect={handleDocumentSelect}
              selectedDocumentFile={selectedDocument}
              documentThreshold={documentThreshold}
              onDocumentThresholdChange={setDocumentThreshold}
              onClearAll={handleClearAll}
              suggestions={suggestionBooks}
              loadingSuggestions={loadingSuggestions}
              onSuggestionSelect={(book) => {
                router.push(`/books/${book.id}`);
              }}
              compact={true}
            />
          </Box>
          <DarkModeToggle />
        </Toolbar>
        {loading && (
          <LinearProgress
            color="secondary"
            sx={{
              height: 3,
            }}
          />
        )}
      </AppBar>
      <Container
        maxWidth="xl"
        sx={{
          py: { xs: 3, sm: 4, md: 5 },
          px: { xs: 2, sm: 3 },
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
              mb: 1,
            }}
          >
            Mulai Jelajahi Buku
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            Jelajahi koleksi buku digital kami
            {selectedDocument
              ? ` (${books.length} hasil dari pencarian dokumen)`
              : selectedImage
              ? ` (${books.length} hasil dari pencarian gambar)`
              : searchQuery
              ? ` (${total} hasil)`
              : total
              ? ` (${total} buku)`
              : ""}
            {selectedDocument && " - Pencarian berdasarkan dokumen aktif"}
            {selectedImage && " - Pencarian berdasarkan gambar aktif"}
          </Typography>
        </Box>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Memuat data buku...
          </Typography>
        )}
        <BookList books={books} isLoading={loading} />
        {!selectedImage && !selectedDocument && totalPages > 1 && (
          <BookPagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
          />
        )}
      </Container>
      <Box
        component="footer"
        sx={{
          mt: "auto",
          borderTop: "1px solid",
          borderColor: "divider",
          px: { xs: 2, sm: 3, md: 4 },
          py: 2,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(15,15,15,0.9)"
              : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(16px)",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
        >
          <span>E-Tanol Library.</span>
          <span>Oleh kelompok E-Tanol Algeo 24/25</span>
        </Typography>
      </Box>
    </Box>
  );
}
