import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";

import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import https from "https";
import fs from "node:fs";

const app = express();

app.use(cors());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

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
    res.send("backend server running at port 4001")
});

app.get("/health", (req, res) => res.send("Service Running"));

// ===================== SERVER STARTER ===================== //

const PORT = process.env.PORT || 4001;

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