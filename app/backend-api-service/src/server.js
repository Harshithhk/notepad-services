import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";

dotenv.config();

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

app.use("/", routes);

app.get("/health", (req, res) => res.send("Service Running"));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Service running on port ${PORT}`));
