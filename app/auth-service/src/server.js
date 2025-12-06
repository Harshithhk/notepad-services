import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();


app.get("/", (req, res) => res.send("Auth Service Running"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Auth-Service running on port", PORT));
