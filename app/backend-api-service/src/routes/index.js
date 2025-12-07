import { Router } from "express";
import { imageUpload } from "../controllers/uploadController.js"
const router = Router();

router.get("/", (req, res) => {
    res.send("backend server running at port 4001")
});



router.put("/presigned-url", imageUpload);

export default router;
