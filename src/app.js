import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import locationRoutes from "./routes/location.routes.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PinPoint API is running",
  });
});

export default app;
