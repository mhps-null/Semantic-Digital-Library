"use client";

import { Pagination, Box } from "@mui/material";

interface BookPaginationProps {
  count: number;
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

export default function BookPagination({
  count,
  page,
  onChange,
}: BookPaginationProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        mt: 4,
        mb: 2,
      }}
    >
      <Pagination
        count={count}
        page={page}
        onChange={onChange}
        color="primary"
        size="large"
        showFirstButton
        showLastButton
        sx={{
          "& .MuiPaginationItem-root": {
            fontSize: "1rem",
          },
        }}
      />
    </Box>
  );
}

