import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import https from "https";
import fs from "node:fs";

dotenv.config();
const app = express();

// CORS
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
        credentials: true,
    })
);

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toUTCString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// DB connection
connectDB();

// Routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => res.send("Auth Service Running"));

// ===================== SERVER STARTER ===================== //

const PORT = process.env.PORT || 4000;

if (process.env.USE_HTTPS === 'true') {
    try {
        const key = fs.readFileSync("./ssl/key.pem");
        const cert = fs.readFileSync("./ssl/cert.pem");

        https.createServer({ key, cert }, app).listen(PORT, () => {
            console.log(` HTTPS Auth-Service running on https with port: ${PORT}`);
        });

    } catch (error) {
        console.error("HTTPS certificates missing! Running HTTP fallback.");
        app.listen(PORT, () =>
            console.log(`HTTP Auth-Service running on http with port: ${PORT}`)
        );
    }

} else {
    app.listen(PORT, () =>
        console.log(`HTTP Auth-Service running on http with port: ${PORT}`)
    );
}
