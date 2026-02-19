"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  IconButton,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DarkModeToggle from "../../components/DarkModeToggle";
import BookDetail, { BookDetailData } from "../../components/BookDetail";
import BookList from "../../components/BookList";
import { Book } from "../../types/book";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface BookDetailApiResponse {
  id: string;
  title: string;
  cover_url: string;
  read_url: string;
  text_content: string;
  recommendations: {
    id: string;
    title: string;
    cover_url: string;
  }[];
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [book, setBook] = useState<BookDetailData | null>(null);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchBook = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/books/${id}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch book detail");
        }

        const data: BookDetailApiResponse = await response.json();

        const mappedBook: BookDetailData = {
          id: data.id,
          title: data.title,
          coverUrl: data.cover_url.startsWith("http")
            ? data.cover_url
            : `${API_BASE_URL}${data.cover_url}`,
          readUrl: data.read_url.startsWith("http")
            ? data.read_url
            : `${API_BASE_URL}${data.read_url}`,
          textContent: data.text_content,
          recommendations: [],
        };

        const mappedRecommendations: Book[] = data.recommendations.map(
          (item) => ({
            id: item.id,
            title: item.title,
            coverImage: item.cover_url.startsWith("http")
              ? item.cover_url
              : `${API_BASE_URL}${item.cover_url}`,
          })
        );

        mappedBook.recommendations = mappedRecommendations;

        setBook(mappedBook);
        setRecommendations(mappedRecommendations);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error(err);
        setError(
          "Gagal mengambil detail buku dari server. Pastikan backend berjalan."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBook();

    return () => {
      controller.abort();
    };
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
        backgroundImage: (theme) =>
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top left, rgba(59,130,246,0.2), transparent 55%), radial-gradient(circle at bottom right, rgba(147,51,234,0.18), transparent 55%)"
            : "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 55%), radial-gradient(circle at bottom right, rgba(236,72,153,0.10), transparent 55%)",
        backgroundAttachment: "fixed",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        color="default"
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
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.1rem", sm: "1.35rem" },
              color: "text.primary",
              letterSpacing: "0.3px",
              flexGrow: 1,
            }}
          >
            Detail Buku
          </Typography>
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
          gap: 4,
        }}
      >
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading && !book && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "300px",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {book && (
          <>
            <BookDetail book={book} />

            {recommendations.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    mb: 2.5,
                  }}
                >
                  Rekomendasi Buku Terkait
                </Typography>
                <BookList books={recommendations} />
              </Box>
            )}
          </>
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
