import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    res.send("backend server running at port 4001")
});

export default router;
