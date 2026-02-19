"use client";

import { useState, useRef, useEffect } from "react";
import {
  TextField,
  InputAdornment,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Slider,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { Book } from "../types/book";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onImageSelect?: (imageFile: File | null) => void;
  selectedImageFile?: File | null;
  imageThreshold?: number;
  onImageThresholdChange?: (value: number) => void;
  onDocumentSelect?: (documentFile: File | null) => void;
  selectedDocumentFile?: File | null;
  documentThreshold?: number;
  onDocumentThresholdChange?: (value: number) => void;
  onClearAll?: () => void;
  suggestions?: Book[];
  loadingSuggestions?: boolean;
  onSuggestionSelect?: (book: Book) => void;
  placeholder?: string;
  compact?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onImageSelect,
  selectedImageFile,
  imageThreshold,
  onImageThresholdChange,
  onDocumentSelect,
  selectedDocumentFile,
  documentThreshold,
  onDocumentThresholdChange,
  onClearAll,
  suggestions,
  loadingSuggestions = false,
  onSuggestionSelect,
  placeholder = "Cari buku berdasarkan judul atau penulis...",
  compact = false,
}: SearchBarProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDocumentDragActive, setIsDocumentDragActive] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingDocumentFile, setPendingDocumentFile] = useState<File | null>(
    null
  );
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (selectedImageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedImageFile);
      setPendingImageFile(selectedImageFile);
    } else {
      setImagePreview(null);
      setPendingImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [selectedImageFile]);

  useEffect(() => {
    if (selectedDocumentFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string);
      };
      reader.readAsText(selectedDocumentFile);
      setPendingDocumentFile(selectedDocumentFile);
    } else {
      setDocumentPreview(null);
      setPendingDocumentFile(null);
      if (documentInputRef.current) {
        documentInputRef.current.value = "";
      }
    }
  }, [selectedDocumentFile]);

  const processImageFile = (file: File | null | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;

    setPendingImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (onImageSelect) {
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsDragActive(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
      setIsDragActive(false);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onImageSelect) {
      onImageSelect(null);
    }
  };

  const processDocumentFile = (file: File | null | undefined) => {
    if (!file || !file.name.toLowerCase().endsWith(".txt")) return;

    setPendingDocumentFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentPreview(reader.result as string);
    };
    reader.readAsText(file);
  };

  const handleOpenDocumentDialog = () => {
    if (selectedDocumentFile && !pendingDocumentFile) {
      setPendingDocumentFile(selectedDocumentFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string);
      };
      reader.readAsText(selectedDocumentFile);
    }
    setIsDocumentDialogOpen(true);
  };

  const handleCloseDocumentDialog = () => {
    setIsDocumentDialogOpen(false);
    setIsDocumentDragActive(false);
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processDocumentFile(file);
      setIsDocumentDragActive(false);
    }
  };

  const handleClearDocument = () => {
    setDocumentPreview(null);
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
    if (onDocumentSelect) {
      onDocumentSelect(null);
    }
  };

  const handleDocumentDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDocumentDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith(".txt")) {
      processDocumentFile(file);
    }
  };

  const handleDocumentDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDocumentDragActive) {
      setIsDocumentDragActive(true);
    }
  };

  const handleDocumentDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDocumentDragActive(false);
  };

  const handleConfirmDocumentSearch = () => {
    if (!pendingDocumentFile || !onDocumentSelect) return;
    onDocumentSelect(pendingDocumentFile);
    setIsDocumentDialogOpen(false);
    setIsDocumentDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processImageFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragActive) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!isDialogOpen) return;
      const clipboardFiles = event.clipboardData?.files;
      let file: File | null | undefined = clipboardFiles?.[0];

      if (!file && event.clipboardData?.items) {
        for (let i = 0; i < event.clipboardData.items.length; i++) {
          const item = event.clipboardData.items[i];
          if (item.type.startsWith("image/")) {
            file = item.getAsFile() ?? undefined;
            break;
          }
        }
      }

      if (file && file.type.startsWith("image/")) {
        event.preventDefault();
        processImageFile(file);
        setIsDragActive(false);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isDialogOpen]);

  const effectiveThreshold = imageThreshold ?? 0.3;
  const effectiveDocumentThreshold = documentThreshold ?? 0.1;

  const handleThresholdSliderChange = (
    _event: Event,
    value: number | number[]
  ) => {
    if (!onImageThresholdChange) return;
    const numeric = Array.isArray(value) ? value[0] : value;
    const clamped = Math.max(0, Math.min(1, numeric));
    onImageThresholdChange(clamped);
  };

  const handleDocumentThresholdSliderChange = (
    _event: Event,
    value: number | number[]
  ) => {
    if (!onDocumentThresholdChange) return;
    const numeric = Array.isArray(value) ? value[0] : value;
    const clamped = Math.max(0, Math.min(1, numeric));
    onDocumentThresholdChange(clamped);
  };

  const handleDocumentThresholdInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!onDocumentThresholdChange) return;
    const value = Number(event.target.value);
    if (Number.isNaN(value)) return;
    const clamped = Math.max(0, Math.min(1, value));
    onDocumentThresholdChange(clamped);
  };

  const handleConfirmImageSearch = () => {
    if (!pendingImageFile || !onImageSelect) return;
    onImageSelect(pendingImageFile);
    setIsDialogOpen(false);
    setIsDragActive(false);
  };

  const handleThresholdInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!onImageThresholdChange) return;
    const value = Number(event.target.value);
    if (Number.isNaN(value)) return;
    const clamped = Math.max(0, Math.min(1, value));
    onImageThresholdChange(clamped);
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(value.trim());
    }
  };

  const showSuggestions =
    isFocused &&
    !!suggestions &&
    suggestions.length > 0 &&
    value.trim().length > 0;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        maxWidth: "100%",
        position: "relative",
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
        size={compact ? "small" : "medium"}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize={compact ? "small" : "medium"} />
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            backgroundColor: "background.paper",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 0 0 1px rgba(255,255,255,0.04)"
                : "0 1px 3px rgba(15,23,42,0.08)",
            "&:hover": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
              },
            },
            "&.Mui-focused": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
                borderWidth: 2,
              },
            },
          },
        }}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={documentInputRef}
        onChange={handleDocumentChange}
        accept=".txt"
        style={{ display: "none" }}
      />
      <Tooltip title="Cari berdasarkan gambar cover">
        <IconButton
          onClick={handleOpenDialog}
          color={imagePreview ? "primary" : "default"}
          sx={{
            backgroundColor: (theme) =>
              imagePreview
                ? theme.palette.mode === "dark"
                  ? "rgba(59,130,246,0.18)"
                  : "primary.light"
                : "background.paper",
            "&:hover": {
              backgroundColor: (theme) =>
                imagePreview
                  ? theme.palette.mode === "dark"
                    ? "rgba(59,130,246,0.35)"
                    : "primary.main"
                  : "action.hover",
            },
          }}
        >
          <ImageIcon fontSize={compact ? "small" : "medium"} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cari berdasarkan dokumen teks">
        <IconButton
          onClick={handleOpenDocumentDialog}
          color={documentPreview ? "primary" : "default"}
          sx={{
            backgroundColor: (theme) =>
              documentPreview
                ? theme.palette.mode === "dark"
                  ? "rgba(59,130,246,0.18)"
                  : "primary.light"
                : "background.paper",
            "&:hover": {
              backgroundColor: (theme) =>
                documentPreview
                  ? theme.palette.mode === "dark"
                    ? "rgba(59,130,246,0.35)"
                    : "primary.main"
                  : "action.hover",
            },
          }}
        >
          <DescriptionIcon fontSize={compact ? "small" : "medium"} />
        </IconButton>
      </Tooltip>
      {imagePreview && (
        <Box
          sx={{
            position: "relative",
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <IconButton
            size="small"
            onClick={handleClearImage}
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              width: 16,
              height: 16,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Box>
      )}
      {documentPreview && (
        <Box
          sx={{
            position: "relative",
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "background.paper",
          }}
        >
          <DescriptionIcon fontSize="small" />
          <IconButton
            size="small"
            onClick={handleClearDocument}
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              width: 16,
              height: 16,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Box>
      )}
      {(value.trim() || selectedImageFile || selectedDocumentFile) &&
        onClearAll && (
          <Tooltip title="Hapus semua pencarian">
            <IconButton
              onClick={onClearAll}
              color="default"
              sx={{
                backgroundColor: "background.paper",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}

      {(showSuggestions || loadingSuggestions) && (
        <Box
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            mt: 0.5,
            width: "100%",
            zIndex: 10,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 12px 32px rgba(0,0,0,0.9)"
                : "0 16px 40px rgba(15,23,42,0.18)",
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {loadingSuggestions ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 3,
              }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : (
            suggestions?.map((s) => {
              const thumb =
                s.coverImage ||
                "https://via.placeholder.com/40x60.png?text=No+Cover";

              return (
                <Box
                  key={s.id}
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    onChange(s.title);
                    onSuggestionSelect?.(s);
                    handleSubmit();
                    setIsFocused(false);
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 48,
                      borderRadius: 0.75,
                      overflow: "hidden",
                      flexShrink: 0,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "grey.100",
                    }}
                  >
                    <img
                      src={thumb}
                      alt={s.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      color="text.primary"
                    >
                      {s.title}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      )}

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontWeight: 700,
          }}
        >
          Cari Menggunakan Cover Buku
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1.5 }}>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: isDragActive ? "primary.main" : "divider",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                backgroundColor: isDragActive
                  ? "action.hover"
                  : "background.default",
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Seret & lepas gambar cover di sini
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Atau klik untuk memilih file dari perangkat Anda, atau tekan{" "}
                <b>Ctrl + V</b> jika gambar ada di clipboard.
              </Typography>
              {imagePreview && (
                <Box
                  sx={{
                    mx: "auto",
                    mt: 2,
                    width: 160,
                    height: 220,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? "0 6px 18px rgba(0,0,0,0.7)"
                        : "0 8px 20px rgba(15,23,42,0.18)",
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ textAlign: "left" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Kemiripan
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Atur kemiripan cover buku yang ingin dicari. Semakin{" "}
                <b>rendah</b> nilai, hasil akan semakin mirip.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Slider
                  value={effectiveThreshold}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={handleThresholdSliderChange}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Threshold"
                  type="number"
                  size="small"
                  value={effectiveThreshold}
                  onChange={handleThresholdInputChange}
                  inputProps={{ min: 0, max: 1, step: 0.01 }}
                  sx={{ width: 100 }}
                />
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Chip
                  label="Rekomendasi"
                  size="small"
                  variant="outlined"
                  onClick={() => onImageThresholdChange?.(0.5)}
                />
                <Chip
                  label="Mirip"
                  size="small"
                  variant="outlined"
                  onClick={() => onImageThresholdChange?.(0.3)}
                />
                <Chip
                  label="Sangat Mirip"
                  size="small"
                  variant="outlined"
                  onClick={() => onImageThresholdChange?.(0.1)}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Tutup</Button>
          <Button
            variant="contained"
            onClick={handleConfirmImageSearch}
            disabled={!pendingImageFile}
          >
            Cari
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDocumentDialogOpen}
        onClose={handleCloseDocumentDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontWeight: 700,
          }}
        >
          Cari Menggunakan Dokumen Teks
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1.5 }}>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: isDocumentDragActive ? "primary.main" : "divider",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                backgroundColor: isDocumentDragActive
                  ? "action.hover"
                  : "background.default",
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
              }}
              onClick={() => documentInputRef.current?.click()}
              onDrop={handleDocumentDrop}
              onDragOver={handleDocumentDragOver}
              onDragLeave={handleDocumentDragLeave}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Seret & lepas file .txt di sini
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Atau klik untuk memilih file .txt dari perangkat Anda.
              </Typography>
              {documentPreview && (
                <Box
                  sx={{
                    mx: "auto",
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                    maxHeight: 200,
                    overflow: "auto",
                    textAlign: "left",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Preview (pertama 500 karakter):
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                    }}
                  >
                    {documentPreview.substring(0, 500)}
                    {documentPreview.length > 500 && "..."}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ textAlign: "left" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Kemiripan
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Atur batas minimum kemiripan dokumen. Semakin <b>tinggi</b>{" "}
                nilai, hasil akan semakin mirip.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Slider
                  value={effectiveDocumentThreshold}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={handleDocumentThresholdSliderChange}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Threshold"
                  type="number"
                  size="small"
                  value={effectiveDocumentThreshold}
                  onChange={handleDocumentThresholdInputChange}
                  inputProps={{ min: 0, max: 1, step: 0.01 }}
                  sx={{ width: 100 }}
                />
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Chip
                  label="Lebih Banyak Hasil"
                  size="small"
                  variant="outlined"
                  onClick={() => onDocumentThresholdChange?.(0.1)}
                />
                <Chip
                  label="Mirip"
                  size="small"
                  variant="outlined"
                  onClick={() => onDocumentThresholdChange?.(0.3)}
                />
                <Chip
                  label="Sangat Mirip"
                  size="small"
                  variant="outlined"
                  onClick={() => onDocumentThresholdChange?.(0.5)}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDocumentDialog}>Tutup</Button>
          <Button
            variant="contained"
            onClick={handleConfirmDocumentSearch}
            disabled={!pendingDocumentFile}
          >
            Cari
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
