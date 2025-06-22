import express from "express";
import cors from "cors";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import { authRouter } from "./routes/auth.js";
import { notesRouter } from "./routes/notes.js";

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/notes", notesRouter);
app.use("/api/auth", authRouter);

// For all undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint not found. Please check the API documentation.",
  });
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port: ${process.env.PORT}`);
});
