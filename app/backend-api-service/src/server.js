import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";

import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import https from "https";
import fs from "node:fs";

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  const timestamp = new Date().toUTCString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

connectDB();

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("backend server running at port 4001");
});

app.get("/health", (req, res) => res.send("Service Running"));

// ===================== SERVER STARTER ===================== //

const PORT = process.env.PORT || 4001;


  app.listen(PORT, () =>
    console.log(`HTTP Backend-Service running on http with port: ${PORT}`)
  )
