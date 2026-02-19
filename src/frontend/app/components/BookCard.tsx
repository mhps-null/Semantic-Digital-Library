"use client";

import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { Book } from "../types/book";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const coverImage =
    book.coverImage ||
    "https://via.placeholder.com/300x400.png?text=No+Cover+Available";

  return (
    <Card
      sx={{
        width: "100%",
        height: "520px",
        maxWidth: "100%",
        minWidth: 0,
        maxHeight: "520px",
        minHeight: "520px",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
        transition: "all 0.3s ease-in-out",
        border: "1px solid",
        borderColor: "divider",
        boxSizing: "border-box",
        margin: 0,
        padding: 0,
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 24px rgba(0,0,0,0.4)"
              : "0 8px 24px rgba(0,0,0,0.15)",
        },
      }}
      elevation={0}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "2 / 3",
          flexShrink: 0,
          backgroundColor: "grey.100",
          overflow: "hidden",
          boxSizing: "border-box",
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
            objectFit: "contain", // rasio container == rasio gambar, jadi tidak ada ruang kosong
            display: "block",
            transition: "transform 0.3s ease-in-out",
            boxSizing: "border-box",
          }}
        />
      </Box>
      <CardContent
        sx={{
          width: "100%",
          flex: 1,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          p: 2.5,
          boxSizing: "border-box",
          overflow: "hidden",
          "&:last-child": {
            pb: 2.5,
          },
        }}
      >
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 600,
            mb: typeof book.similarityScore === "number" ? 0.75 : 0.25,
            fontSize: "1rem",
            lineHeight: 1.5,
            wordBreak: "break-word",
            overflowWrap: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: typeof book.similarityScore === "number" ? 2 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {book.title}
        </Typography>
        {typeof book.similarityScore === "number" && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: "0.75rem",
              display: "block",
              flexShrink: 0,
              mt: "auto",
              pt: 0.5,
            }}
          >
            Skor kemiripan: {book.similarityScore.toFixed(2)}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
