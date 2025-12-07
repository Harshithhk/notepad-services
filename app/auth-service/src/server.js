import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

const corsOptions = {
    origin: true,
    credentials: true,
}

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

app.use("/auth", authRoutes);

app.get("/", (req, res) => res.send("Auth Service Running"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Auth-Service running on port", PORT));
