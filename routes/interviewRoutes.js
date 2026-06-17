import express from "express"
import { CreateInterview, getInterview } from "../controllers/interviewController.js"
import verifyJWTToken from "../middlewares/verifyJWTToken.js"
const router = express.Router();

router.post("/create",verifyJWTToken,CreateInterview);
router.get("/:id", verifyJWTToken,getInterview)
export default router;