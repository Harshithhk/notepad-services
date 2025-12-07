import dotenv from "dotenv";
import { interpretation } from "./interpreter.js";

dotenv.config();

const NOTE_ID = process.env.NOTE_ID;
const IMAGE_URL = process.env.IMAGE_URL;

const main = async () => {
    console.log(`ECS Fargate Task started for note ${NOTE_ID}`);

    await interpretation(NOTE_ID, IMAGE_URL);

    console.log(`ECS Fargate Task finished for note ${NOTE_ID}`);
};

main();

