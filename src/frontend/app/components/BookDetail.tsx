"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import { Book } from "../types/book";

export interface BookDetailData {
  id: string;
  title: string;
  coverUrl: string;
  readUrl: string;
  textContent: string;
  recommendations: Book[];
}

interface BookDetailProps {
  book: BookDetailData;
}

export default function BookDetail({ book }: BookDetailProps) {
  const leftCardRef = useRef<HTMLDivElement | null>(null);
  const [leftCardHeight, setLeftCardHeight] = useState<number | null>(null);

  const coverImage =
    book.coverUrl ||
    "https://via.placeholder.com/300x400.png?text=No+Cover+Available";

  const normalizedTextContent = (() => {
    if (!book.textContent) return "";

    const unified = book.textContent.replace(/\r\n/g, "\n");

    const cleanedLines = unified
      .split("\n")
      .map((line) => line.replace(/\s+$/g, "")) // trim kanan
      .map((line) =>
        line.replace(/^\s+/g, (match) => (match.length > 4 ? "    " : " "))
      );

    const rejoined = cleanedLines.join("\n");

    return rejoined.replace(/\n{3,}/g, "\n\n").trim();
  })();

  useEffect(() => {
    if (!leftCardRef.current) return;

    const updateHeight = () => {
      if (leftCardRef.current) {
        setLeftCardHeight(leftCardRef.current.offsetHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(leftCardRef.current);

    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 320px) minmax(0, 1fr)",
        },
        gap: { xs: 4, md: 6 },
        alignItems: "flex-start",
      }}
    >
      <Card
        ref={leftCardRef}
        sx={{
          maxWidth: 380,
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 14px 40px rgba(0,0,0,0.65)"
              : "0 18px 45px rgba(15,23,42,0.18)",
        }}
        elevation={0}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "2 / 3",
            backgroundImage: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #020617, #111827)"
                : "linear-gradient(135deg, #e5e7eb, #f9fafb)",
            overflow: "hidden",
          }}
        >
          <CardMedia
            component="img"
            image={coverImage}
            alt={book.title}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            p: 2.5,
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.4,
              mb: 0.5,
            }}
          >
            {book.title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip
              label="Buku Digital"
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip label={`ID: ${book.id}`} size="small" variant="outlined" />
          </Stack>
          <Typography
            variant="body2"
            color="primary"
            component="a"
            href={book.readUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              mt: 1,
              fontWeight: 500,
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Baca teks lengkap
          </Typography>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            height: leftCardHeight ?? "auto",
            maxHeight: leftCardHeight ?? "none",
            overflowY: "auto",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 10px 32px rgba(0,0,0,0.6)"
                : "0 12px 35px rgba(15,23,42,0.14)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            Ringkasan Konten
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.8,
              letterSpacing: "0.01em",
            }}
          >
            {normalizedTextContent}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
