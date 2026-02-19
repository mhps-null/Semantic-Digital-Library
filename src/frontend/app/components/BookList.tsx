"use client";

import { Grid, Box, Typography } from "@mui/material";
import { Book } from "../types/book";
import BookCard from "./BookCard";
import Link from "next/link";

interface BookListProps {
  books: Book[];
  isLoading?: boolean;
}

export default function BookList({ books, isLoading }: BookListProps) {
  if (!isLoading && books.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          py: 8,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Tidak ada buku ditemukan
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(4, 1fr)",
          lg: "repeat(5, 1fr)",
          xl: "repeat(5, 1fr)",
        },
        gap: 3,
        width: "100%",
        gridAutoRows: "520px",
        alignItems: "start",
      }}
    >
      {books.map((book) => (
        <Box key={book.id} sx={{ width: "100%", height: "100%", minHeight: 0 }}>
          <Link
            href={`/books/${book.id}`}
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              textDecoration: "none",
            }}
          >
            <BookCard book={book} />
          </Link>
        </Box>
      ))}
    </Box>
  );
}
