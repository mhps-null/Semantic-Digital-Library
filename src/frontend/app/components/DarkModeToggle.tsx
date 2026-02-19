"use client";

import { IconButton, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useTheme } from "../contexts/ThemeContext";

export default function DarkModeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <Tooltip title={mode === "light" ? "Dark Mode" : "Light Mode"}>
      <IconButton
        onClick={toggleMode}
        sx={{
          color: "text.primary",
          "&:hover": {
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
          },
        }}
      >
        {mode === "light" ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
}

