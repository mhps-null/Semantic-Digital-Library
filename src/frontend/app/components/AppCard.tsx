"use client";

import { Card } from "@mui/material";

type Props = {
  children: React.ReactNode;
  sx?: any;
  elevation?: number;
};

const AppCard = ({ children, sx, elevation = 3 }: Props) => {
  return (
    <Card
      sx={{ display: "flex", p: 0, ...sx }}
      elevation={elevation}
    >
      {children}
    </Card>
  );
};

export default AppCard;

