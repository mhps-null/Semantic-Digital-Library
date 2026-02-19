"use client";

import { createTheme, Theme } from "@mui/material/styles";

export const getTheme = (mode: "light" | "dark"): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "light" ? "#5D87FF" : "#5D87FF",
        light: mode === "light" ? "#ECF2FF" : "#253662",
        dark: "#4570EA",
        contrastText: "#ffffff",
      },
      secondary: {
        main: mode === "light" ? "#49BEFF" : "#49BEFF",
        light: mode === "light" ? "#E8F7FF" : "#1C455D",
        dark: "#23afdb",
        contrastText: "#ffffff",
      },
      background: {
        default: mode === "light" ? "#f5f5f5" : "#2A3447",
        paper: mode === "light" ? "#ffffff" : "#2A3447",
      },
    },
    typography: {
      fontFamily: [
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
      ].join(","),
    },
    shape: {
      borderRadius: 8,
    },
  });
};

const theme = getTheme("light");
export default theme;
